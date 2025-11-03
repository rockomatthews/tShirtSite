import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { coinbaseCreateCharge } from "@/lib/coinbase";

function priceFrom(baseCents: number, markupPct: number) {
  const cents = Math.round(baseCents * (1 + markupPct / 100));
  return { cents, major: cents / 100 };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantSku, quantity = 1, recipient } = body || {};
  if (!productId || !variantSku) return new Response("bad request", { status: 400 });

  const product = await db.product.findUnique({ where: { id: productId }, include: { variants: true, design: true } });
  if (!product) return new Response("not found", { status: 404 });
  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) return new Response("variant not found", { status: 404 });

  const { cents, major } = priceFrom(product.baseCost, product.markupPct);
  const totalCents = cents * Number(quantity);

  const order = await db.order.create({
    data: {
      status: "pending",
      total: totalCents,
      items: { create: [{ productVariantId: variant.id, qty: Number(quantity), unitPrice: cents }] },
      externalIds: { coinbase: { status: "created" }, recipient },
    },
    include: { items: true },
  });

  const charge = await coinbaseCreateCharge({
    name: product.title,
    description: `Order ${order.id}`,
    amount: major * Number(quantity),
    currency: "USD",
    metadata: { orderId: order.id, productId, variantSku },
  });

  return Response.json({ orderId: order.id, hosted_url: charge?.data?.hosted_url ?? charge?.hosted_url });
}


