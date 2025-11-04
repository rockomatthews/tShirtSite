import { NextRequest } from "next/server";
import { verifyCoinbaseWebhook } from "@/lib/coinbase";
import { db } from "@/lib/db";
import { getDefaultShopId, createPrintifyOrder, uploadImageToPrintify } from "@/lib/printify";
import { renderSerialOverlayPng } from "@/lib/serial";
import { crossmintMint } from "@/lib/crossmint";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-cc-webhook-signature") || req.headers.get("X-CC-Webhook-Signature") || "";
  try {
    if (!verifyCoinbaseWebhook(raw, sig)) return new Response("invalid signature", { status: 400 });
  } catch {
    return new Response("webhook verify failed", { status: 400 });
  }
  const event = JSON.parse(raw);
  const type: string = event?.event?.type ?? "";
  const metadata = event?.event?.data?.metadata ?? {};
  const orderId: string | undefined = metadata?.orderId;
  if (!orderId) return new Response("ok", { status: 200 });

  if (type === "charge:confirmed" || type === "charge:resolved") {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: { include: { productVariant: { include: { product: { include: { design: true } } } } } } } });
    if (!order) return new Response("ok", { status: 200 });
    // Mark paid
    await db.order.update({ where: { id: orderId }, data: { status: "paid" } });

    // Attempt Printify fulfillment for first item
    const item = order.items[0];
    const product = item.productVariant.product;
    const variant = item.productVariant;
    const placementTag = (product.design.tags ?? []).find((t) => t.startsWith("placement:"));
    const productTag = (product.design.tags ?? []).find((t) => t.startsWith("printify_product:"));
    const placement = placementTag ? JSON.parse(placementTag.replace("placement:", "")) : { x: 0.5, y: 0.38, scale: 0.5 };
    const printifyProductId = productTag ? productTag.replace("printify_product:", "") : "";
    const recipient = (order.externalIds as any)?.recipient ?? {};
    if (printifyProductId && variant.printifyVariantId) {
      const next = await db.product.update({ where: { id: product.id }, data: { mintedPhysical: { increment: 1 } }, select: { mintedPhysical: true } });
      const serialNo = next.mintedPhysical.toString().padStart(4, "0");
      let overlayId = "";
      try {
        const overlay = await renderSerialOverlayPng(serialNo);
        const uint8 = new Uint8Array(overlay.buffer, overlay.byteOffset, overlay.byteLength);
        const ab = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
        const blob = new Blob([ab], { type: "image/png" });
        const file = new File([blob], `serial-${serialNo}.png`, { type: "image/png" });
        const up = await uploadImageToPrintify(file, file.name);
        overlayId = up.id;
      } catch {}
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
          backOverlay: overlayId ? { imageId: overlayId, x: 0.5, y: 0.08, scale: 0.6 } : undefined,
          externalId: `order_${order.id}`,
        });
      } catch (e) {
        // swallow, webhook already acknowledged
      }
      try {
        if (product.solanaCollection) {
          const meta = {
            name: `${product.title} #${serialNo}`,
            description: product.description ?? undefined,
            image: product.design.previewKey,
            attributes: [
              { trait_type: "Edition", value: serialNo },
              { trait_type: "Mint Type", value: "Physical" },
            ],
          };
          await crossmintMint({ collectionId: product.solanaCollection, recipient: (order.user?.email ?? "") as any, metadata: meta });
          await db.orderItem.update({ where: { id: item.id }, data: { nftStatus: "pending" } });
        }
      } catch {}
    }
  }
  return new Response("ok", { status: 200 });
}


