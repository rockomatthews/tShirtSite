import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBlueprintsV2, getProvidersForBlueprintV2, getVariantsForProviderV1, getDefaultShopId, createPrintifyProduct } from "@/lib/printify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { maxSupplyPhysical = 100, maxSupplyVirtual = 100 } = await req.json();
  // Fetch design and create a product immediately (black variants, default sizes)
  const design = await db.design.findUnique({ where: { id } });
  if (!design) return new Response("not found", { status: 404 });

  const imageId = String(design.fileKey).replace("printify:", "");
  const placementTag = (design.tags ?? []).find((t) => t.startsWith("placement:"));
  const placement = placementTag ? JSON.parse(placementTag.replace("placement:", "")) : { x: 0.5, y: 0.38, scale: 0.5 };
  const title = design.title || "Tee";
  const slug = `${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) + "-" + id.slice(0, 6);

  // Pick blueprint/provider and black variants for sizes S,M,L,XL
  const blueprints = await getBlueprintsV2();
  const bp = (blueprints?.data ?? blueprints)?.find((b: any) => /tee|t[- ]?shirt/i.test(String(b?.title ?? b?.attributes?.title ?? ""))) ?? (blueprints?.data ?? blueprints)?.[0];
  const blueprintId = Number(bp?.id ?? bp?.attributes?.id ?? 0);
  const providers = await getProvidersForBlueprintV2(blueprintId);
  const provider = (providers?.data ?? providers)?.[0];
  const providerId = Number(provider?.id ?? provider?.attributes?.id ?? 0);
  const variantsData = await getVariantsForProviderV1(blueprintId, providerId);
  const catalogVariants: any[] = variantsData?.variants ?? variantsData?.data ?? [];
  const wantedSizes = ["S","M","L","XL"]; 
  const pickVariant = (size: string) => {
    const upper = size.toUpperCase();
    const match = catalogVariants.find((v: any) => String(v?.title ?? v?.name ?? "").toUpperCase().includes(upper) && /BLACK/i.test(String(v?.title ?? v?.name ?? "")));
    return Number(match?.id ?? 0);
  };
  const variantIds = wantedSizes.map(pickVariant).filter((n) => n > 0);
  const minPrice = variantIds
    .map((idNum) => catalogVariants.find((v: any) => Number(v?.id) === idNum)?.price ?? 2000)
    .reduce((m, p) => Math.min(m, Number(p || 2000)), 2000);

  const shopId = await getDefaultShopId();
  const created = await createPrintifyProduct({
    shopId,
    title,
    blueprintId,
    providerId,
    variantIds,
    imageId,
    placement,
  });
  const printifyProductId: string = String(created?.id ?? created?.data?.id ?? "");

  const product = await db.product.create({
    data: {
      slug,
      title,
      designId: design.id,
      baseCost: Number(minPrice || 2000),
      markupPct: 50,
      maxSupplyPhysical: Number(maxSupplyPhysical),
      maxSupplyVirtual: Number(maxSupplyVirtual),
      variants: {
        create: wantedSizes.map((size) => ({ sku: `${slug}-${size}-BLK`, size, color: "black", printifyVariantId: pickVariant(size) || undefined })),
      },
    },
  });

  await db.design.update({ where: { id }, data: { status: "approved", tags: [ ...(design.tags ?? []), "printify_product:" + printifyProductId ] } });
  return Response.json({ ok: true, productId: product.id, slug: product.slug });
}


