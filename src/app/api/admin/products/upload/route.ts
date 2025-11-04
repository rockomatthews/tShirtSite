import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadImageToPrintify, getBlueprintsV2, getProvidersForBlueprintV2, getVariantsForProviderV1, getDefaultShopId, createPrintifyProduct } from "@/lib/printify";
import { createCollection } from "@/lib/crossmint";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let userId: string | undefined = (session as any)?.userId || sessUser?.id;
    if (!userId) {
      const email: string | undefined = sessUser?.email;
      if (email) {
        const u = await db.user.upsert({
          where: { email },
          update: { name: sessUser?.name ?? undefined, image: sessUser?.image ?? undefined },
          create: { email, name: sessUser?.name ?? null, image: sessUser?.image ?? null, role: "user" },
        });
        userId = u.id;
      }
    }
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const form = await req.formData();
    const title = String(form.get("title") ?? "Untitled");
    const description = String(form.get("description") ?? "");
    const priceInput = String(form.get("price") ?? "").trim();
    const priceCents = priceInput ? Math.round(Number(priceInput) * 100) : NaN;
    const maxSupplyPhysical = Number(form.get("maxSupplyPhysical") ?? 100);
    const maxSupplyVirtual = Number(form.get("maxSupplyVirtual") ?? 100);
    const sizesJson = String(form.get("sizes") ?? "[]");
    const sizes: string[] = (() => { try { return JSON.parse(sizesJson); } catch { return []; } })();
    const placement = String(form.get("placement") ?? "{}");
    const imageUrl = (form.get("imageUrl") as string | null) || null;
    const file = form.get("file") as File | null;
    if (!file && !imageUrl) return new Response("Bad request", { status: 400 });

    // Prepare blob for Printify upload
    let uploadBlob: Blob;
    let uploadName = "art.png";
    let previewDataUrl = "";
    if (imageUrl && /^https?:\/\//.test(imageUrl)) {
      const fetched = await fetch(imageUrl);
      const buf = Buffer.from(await fetched.arrayBuffer());
      const ctype = fetched.headers.get("content-type") || "image/png";
      uploadBlob = new Blob([buf], { type: ctype });
      const urlName = (new URL(imageUrl)).pathname.split("/").pop() || uploadName;
      uploadName = urlName;
      previewDataUrl = `data:${ctype};base64,${buf.toString("base64")}`;
    } else {
      // fall back to file from form
      const f = file as File;
      uploadBlob = f;
      uploadName = f.name || uploadName;
      const fileBuf = Buffer.from(await f.arrayBuffer());
      previewDataUrl = `data:${f.type || "image/png"};base64,${fileBuf.toString("base64")}`;
    }

    const uploaded = await uploadImageToPrintify(uploadBlob, uploadName);

    // Build a data URL preview for UI rendering
    const dataUrl = previewDataUrl;
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

    const baseCost = Number.isFinite(priceCents) ? priceCents : 2000; // If price provided, use it as sale price for now
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
        markupPct: 0,
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


