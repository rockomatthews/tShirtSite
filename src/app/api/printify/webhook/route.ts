import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("Bad request", { status: 400 });
  // Persist raw webhook for audit
  await db.webhookLog.create({ data: { source: "printify", eventType: String(body?.type ?? "unknown"), payloadHash: JSON.stringify(body).slice(0, 9500), status: "received" } });
  // TODO: map Printify event types to update Fulfillment rows
  return Response.json({ ok: true });
}


