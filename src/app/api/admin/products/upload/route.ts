import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadImageToPrintify, getBlueprintsV2, getProvidersForBlueprintV2, getVariantsForProviderV1, getDefaultShopId, createPrintifyProduct } from "@/lib/printify";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const userId: string | undefined = (session as any)?.user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const form = await req.formData();
    const title = String(form.get("title") ?? "Untitled");
    const slug = String(form.get("slug") ?? "");
    const markupPct = Number(form.get("markupPct") ?? 50);
    const maxSupplyPhysical = Number(form.get("maxSupplyPhysical") ?? 100);
    const maxSupplyVirtual = Number(form.get("maxSupplyVirtual") ?? 100);
    const sizesJson = String(form.get("sizes") ?? "[]");
    const sizes: string[] = (() => { try { return JSON.parse(sizesJson); } catch { return []; } })();
    const placement = String(form.get("placement") ?? "{}");
    const file = form.get("file") as File | null;
    if (!file || !slug || sizes.length === 0) return new Response("Bad request", { status: 400 });

    const uploaded = await uploadImageToPrintify(file, file.name || "art.png");

    const design = await db.design.create({
      data: {
        title,
        description: "",
        fileKey: `printify:${uploaded.id}`,
        previewKey: `printify:${uploaded.id}`,
        creatorId: userId,
        status: "approved",
        tags: [],
      },
    });

    // Choose a default blueprint/provider and map selected sizes to Printify variant IDs (black color)
    const blueprints = await getBlueprintsV2();
    const bp = (blueprints?.data ?? blueprints)?.find((b: any) => /tee|t[- ]?shirt/i.test(String(b?.title ?? b?.attributes?.title ?? ""))) ?? (blueprints?.data ?? blueprints)?.[0];
    const blueprintId = Number(bp?.id ?? bp?.attributes?.id ?? 0);
    const providers = await getProvidersForBlueprintV2(blueprintId);
    const provider = (providers?.data ?? providers)?.[0];
    const providerId = Number(provider?.id ?? provider?.attributes?.id ?? 0);
    const variantsData = await getVariantsForProviderV1(blueprintId, providerId);
    const catalogVariants: any[] = variantsData?.variants ?? variantsData?.data ?? [];
    const wanted = (sizes as string[]).map((s) => String(s).toUpperCase());
    const pickVariant = (size: string) => {
      const upper = size.toUpperCase();
      const match = catalogVariants.find((v: any) => String(v?.title ?? v?.name ?? "").toUpperCase().includes(upper) && /BLACK/i.test(String(v?.title ?? v?.name ?? "")));
      return Number(match?.id ?? 0);
    };
    const variantIds = wanted.map(pickVariant).filter((id) => id > 0);

    const shopId = await getDefaultShopId();
    const place = JSON.parse(placement);
    const created = await createPrintifyProduct({
      shopId,
      title,
      description: "",
      blueprintId,
      providerId,
      variantIds,
      imageId: uploaded.id,
      placement: { x: place?.x ?? 0.5, y: place?.y ?? 0.38, scale: place?.scale ?? 0.5 },
    });
    const printifyProductId: string = String(created?.id ?? created?.data?.id ?? "");

    const baseCost = 2000; // placeholder cents; ideally derive from provider variant pricing
    const product = await db.product.create({
      data: {
        slug,
        title,
        designId: design.id,
        baseCost,
        markupPct,
        maxSupplyPhysical,
        maxSupplyVirtual,
        variants: {
          create: (sizes as string[]).map((size) => ({ sku: `${slug}-${size}-BLK`, size, color: "black", printifyVariantId: pickVariant(size) || undefined })),
        },
      },
      include: { variants: true },
    });

    await db.design.update({ where: { id: design.id }, data: { tags: ["placement:" + placement, "printify_product:" + printifyProductId, "printify_blueprint:" + blueprintId, "printify_provider:" + providerId] } });

    return Response.json({ id: product.id, slug: product.slug });
  } catch (e: any) {
    return new Response(`Create failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


