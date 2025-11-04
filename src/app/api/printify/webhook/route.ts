import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("Bad request", { status: 400 });
  // Persist raw webhook for audit
  await db.webhookLog.create({ data: { source: "printify", eventType: String(body?.type ?? "unknown"), payloadHash: JSON.stringify(body).slice(0, 9500), status: "received" } });
  try {
    const type: string = String(body?.type ?? body?.event ?? "");
    const order = body?.resource?.order || body?.order || {};
    const externalId: string | undefined = order?.external_id || order?.metadata?.external_id || undefined;
    if (externalId && externalId.startsWith("order_")) {
      const ourId = externalId.replace("order_", "");
      if (type.includes("created") || type.includes("submitted") || type.includes("sent_to_production")) {
        await db.fulfillment.upsert({
          where: { orderId: ourId },
          create: { orderId: ourId, provider: "printify", status: "production" },
          update: { status: "production" },
        });
      }
      if (type.includes("shipped") || type.includes("delivered") || type.includes("tracking")) {
        const tracking = body?.resource?.shipments || body?.tracking || body?.resource || {};
        await db.fulfillment.upsert({
          where: { orderId: ourId },
          create: { orderId: ourId, provider: "printify", status: "shipped", tracking },
          update: { status: "shipped", tracking },
        });
      }
    }
  } catch {}
  return Response.json({ ok: true });
}


