import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadImageToPrintify, getBlueprintsV2, getProvidersForBlueprintV2, getVariantsForProviderV1, getDefaultShopId, createPrintifyProduct } from "@/lib/printify";
import { createCollection } from "@/lib/crossmint";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const userId: string | undefined = (session as any)?.user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const form = await req.formData();
    const title = String(form.get("title") ?? "Untitled");
    const description = String(form.get("description") ?? "");
    const markupPct = Number(form.get("markupPct") ?? 50);
    const maxSupplyPhysical = Number(form.get("maxSupplyPhysical") ?? 100);
    const maxSupplyVirtual = Number(form.get("maxSupplyVirtual") ?? 100);
    const sizesJson = String(form.get("sizes") ?? "[]");
    const sizes: string[] = (() => { try { return JSON.parse(sizesJson); } catch { return []; } })();
    const placement = String(form.get("placement") ?? "{}");
    const file = form.get("file") as File | null;
    if (!file || sizes.length === 0) return new Response("Bad request", { status: 400 });

    const uploaded = await uploadImageToPrintify(file, file.name || "art.png");

    // Build a data URL preview for UI rendering
    const fileBuf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/png"};base64,${fileBuf.toString("base64")}`;
    const design = await db.design.create({
      data: {
        title,
        description,
        fileKey: `printify:${uploaded.id}`,
        previewKey: dataUrl,
        creatorId: userId,
        status: "approved",
        tags: [
          `placement:${placement}`,
        ],
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
      description,
      blueprintId,
      providerId,
      variantIds,
      imageId: uploaded.id,
      placement: { x: place?.x ?? 0.5, y: place?.y ?? 0.38, scale: place?.scale ?? 0.5 },
    });
    const printifyProductId: string = String(created?.id ?? created?.data?.id ?? "");

    const baseCost = 2000; // placeholder cents; ideally derive from provider variant pricing
    const makeSlug = (t: string, id: string) => `${t}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) + "-" + id.slice(0, 6);
    const tempId = crypto.randomUUID();
    const genSlug = makeSlug(title, tempId);
    const product = await db.product.create({
      data: {
        slug: genSlug,
        title,
        description,
        designId: design.id,
        baseCost,
        markupPct,
        maxSupplyPhysical,
        maxSupplyVirtual,
        variants: {
          create: (sizes as string[]).map((size) => ({ sku: `${genSlug}-${size}-BLK`, size, color: "black", printifyVariantId: pickVariant(size) || undefined })),
        },
      },
      include: { variants: true },
    });

    await db.design.update({ where: { id: design.id }, data: { tags: ["placement:" + placement, "printify_product:" + printifyProductId, "printify_blueprint:" + blueprintId, "printify_provider:" + providerId] } });

    // Ensure Crossmint collection for this product
    try {
      const col = await createCollection({ name: title, image: design.previewKey, description });
      const colId = String(col?.id ?? col?.collectionId ?? "");
      if (colId) await db.product.update({ where: { id: product.id }, data: { solanaCollection: colId, nftStandard: "compressed" } });
    } catch {}

    return Response.json({ id: product.id, slug: product.slug });
  } catch (e: any) {
    return new Response(`Create failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


