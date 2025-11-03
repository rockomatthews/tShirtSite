import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { uploadImageToPrintify } from "@/lib/printify";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.userId ?? null;
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

  // Upload to Printify uploads for storage/preview reuse
  const uploaded = await uploadImageToPrintify(file, file.name || "art.png");

  // Create a Design (approved) owned by admin
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

  // Create Product linked to the Design
  const baseCost = 2000; // cents (placeholder)
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
        create: sizes.map((size) => ({ sku: `${slug}-${size}-BLK`, size, color: "black" })),
      },
    },
    include: { variants: true },
  });

  // Store placement metadata on the design tags for now
  await db.design.update({ where: { id: design.id }, data: { tags: ["placement:" + placement] } });

  return Response.json({ id: product.id, slug: product.slug });
}


