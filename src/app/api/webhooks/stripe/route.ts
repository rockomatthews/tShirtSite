import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: verify signature using STRIPE_WEBHOOK_SECRET
  const body = await req.text();
  // placeholder parse
  console.log("stripe webhook", body.length);
  return new Response("ok");
}


