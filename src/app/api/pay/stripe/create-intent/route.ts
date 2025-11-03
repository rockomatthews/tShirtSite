import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

function priceFrom(baseCents: number, markupPct: number) {
  const cents = Math.round(baseCents * (1 + markupPct / 100));
  return { cents, major: cents / 100 };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantSku, quantity = 1, recipient } = body || {};
  if (!productId || !variantSku) return new Response("bad request", { status: 400 });

  const product = await db.product.findUnique({ where: { id: productId }, include: { variants: true } });
  if (!product) return new Response("not found", { status: 404 });
  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) return new Response("variant not found", { status: 404 });

  const { cents } = priceFrom(product.baseCost, product.markupPct);
  const totalCents = cents * Number(quantity);

  const order = await db.order.create({
    data: {
      status: "pending",
      total: totalCents,
      items: { create: [{ productVariantId: variant.id, qty: Number(quantity), unitPrice: cents }] },
      externalIds: { stripe: { status: "created" }, recipient },
    },
  });

  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, productId, variantSku },
  });

  await db.order.update({ where: { id: order.id }, data: { externalIds: { stripe: { paymentIntentId: pi.id }, recipient } } as any });
  return Response.json({ orderId: order.id, client_secret: pi.client_secret });
}


