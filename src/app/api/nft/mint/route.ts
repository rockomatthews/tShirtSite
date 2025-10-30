import { NextRequest } from "next/server";
import { crossmintMint } from "@/lib/crossmint";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { orderItemId, recipient } = await req.json();
  if (!orderItemId || !recipient) return new Response("bad request", { status: 400 });
  try {
    // Fetch linked product and enforce max supply
    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { productVariant: { include: { product: true } } },
    });
    if (!item) return new Response("not found", { status: 404 });
    const product = item.productVariant.product;
    const needed = item.qty;
    if (product.mintedCount + needed > product.maxSupply) {
      return new Response("sold out", { status: 409 });
    }

    const out = await crossmintMint({ orderItemId, recipient });

    // Persist simplistic success; in production, use values from Crossmint response
    await db.$transaction([
      db.orderItem.update({
        where: { id: orderItemId },
        data: { nftStatus: "minted", nftMintAddress: (out as any).mintAddress ?? null },
      }),
      db.product.update({
        where: { id: product.id },
        data: { mintedCount: product.mintedCount + needed },
      }),
    ]);

    return Response.json(out);
  } catch (e: any) {
    return new Response(e?.message ?? "mint failed", { status: 500 });
  }
}


