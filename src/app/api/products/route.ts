import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const where = slug ? { isActive: true, slug } : { isActive: true } as any;
    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { design: true, variants: true },
    });
    // project placement from tags
    const map = products.map((p) => {
      const placementTag = (p.design?.tags ?? []).find((t) => t.startsWith("placement:"));
      let placement: any = null;
      try { placement = placementTag ? JSON.parse(placementTag.replace("placement:", "")) : null; } catch {}
      const price = Math.round((p.baseCost * (1 + (p.markupPct || 0) / 100)))/100;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        art: p.design?.previewKey || p.design?.fileKey,
        placement,
        price,
      };
    });
    return Response.json({ products: map });
  } catch (e: any) {
    return new Response(`products failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


