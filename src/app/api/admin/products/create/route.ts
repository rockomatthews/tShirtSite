import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, slug, markupPct, blueprintId, providerId, variantIds, maxSupplyPhysical, maxSupplyVirtual } = body ?? {};
  if (!title || !slug || !Array.isArray(variantIds) || variantIds.length === 0) return new Response("bad request", { status: 400 });
  // Placeholder: no design linkage yet; attach first variant data
  const product = await db.product.create({
    data: {
      title,
      slug,
      description: null,
      designId: (await ensurePlaceholderDesign()).id,
      baseCost: 2000,
      markupPct: Number(markupPct) || 50,
      providerId: String(providerId ?? ""),
      printifyBlueprintId: Number(blueprintId) || null,
      maxSupplyPhysical: Number(maxSupplyPhysical) || 100,
      maxSupplyVirtual: Number(maxSupplyVirtual) || 100,
      variants: {
        create: (variantIds as number[]).map((vid, ix) => ({
          sku: `SKU-${slug}-${vid}-${ix}`,
          size: "",
          color: "",
          printifyVariantId: Number(vid),
        })),
      },
    },
  });
  return Response.json({ id: product.id, slug: product.slug });
}

async function ensurePlaceholderDesign() {
  const existing = await db.design.findFirst({ where: { title: "Placeholder" } });
  if (existing) return existing;
  return db.design.create({ data: { title: "Placeholder", fileKey: "", previewKey: "", creatorId: (await ensurePlaceholderUser()).id, status: "approved", tags: [] } });
}

async function ensurePlaceholderUser() {
  const existing = await db.user.findFirst({ where: { email: "placeholder@example.com" } });
  if (existing) return existing;
  return db.user.create({ data: { email: "placeholder@example.com", name: "System" } });
}


