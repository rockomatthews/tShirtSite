import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getDefaultShopId, createPrintifyOrder } from "@/lib/printify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: any;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    event = stripe.webhooks.constructEvent(body, sig ?? "", secret);
  } catch (err) {
    return new Response("invalid signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId as string | undefined;
    if (orderId) {
      const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { include: { productVariant: { include: { product: { include: { design: true } } } } } } } });
      if (order) {
        await db.order.update({ where: { id: orderId }, data: { status: "paid" } });
        const item = order.items[0];
        const product = item.productVariant.product;
        const variant = item.productVariant;
        const placementTag = (product.design.tags ?? []).find((t) => t.startsWith("placement:"));
        const productTag = (product.design.tags ?? []).find((t) => t.startsWith("printify_product:"));
        const placement = placementTag ? JSON.parse(placementTag.replace("placement:", "")) : { x: 0.5, y: 0.38, scale: 0.5 };
        const printifyProductId = productTag ? productTag.replace("printify_product:", "") : "";
        const recipient = (order.externalIds as any)?.recipient ?? {};
        if (printifyProductId && variant.printifyVariantId) {
          const shopId = await getDefaultShopId();
          try {
            await createPrintifyOrder({
              shopId,
              productId: printifyProductId,
              variantId: Number(variant.printifyVariantId),
              quantity: item.qty,
              imageId: String(product.design.fileKey).replace("printify:", ""),
              placement,
              recipient,
            });
          } catch {}
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
}


