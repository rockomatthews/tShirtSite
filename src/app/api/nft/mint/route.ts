import { NextRequest } from "next/server";
import { crossmintMint } from "@/lib/crossmint";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { orderItemId, recipient, email, mintType } = await req.json();
  if (!orderItemId) return new Response("bad request", { status: 400 });
  try {
    // Fetch linked product and enforce max supply
    const item = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { productVariant: { include: { product: true } } },
    });
    if (!item) return new Response("not found", { status: 404 });
    const product = item.productVariant.product;
    const needed = item.qty;
    const isVirtual = mintType === "virtual";
    const cap = isVirtual ? product.maxSupplyVirtual : product.maxSupplyPhysical;
    const minted = isVirtual ? product.mintedVirtual : product.mintedPhysical;
    if (cap !== null && minted + needed > cap) return new Response("sold out", { status: 409 });

    const to = recipient ?? email; // server will resolve email to wallet in crossmintMint in future
    if (!to) return new Response("recipient missing", { status: 400 });
    const out = await crossmintMint({ orderItemId, recipient: to });

    // Persist simplistic success; in production, use values from Crossmint response
    await db.$transaction([
      db.orderItem.update({
        where: { id: orderItemId },
        data: { nftStatus: "minted", nftMintAddress: (out as any).mintAddress ?? null },
      }),
      db.product.update({
        where: { id: product.id },
        data: isVirtual
          ? { mintedVirtual: minted + needed }
          : { mintedPhysical: minted + needed },
      }),
    ]);

    return Response.json(out);
  } catch (e: any) {
    return new Response(e?.message ?? "mint failed", { status: 500 });
  }
}


