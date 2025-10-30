import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  console.log("printify webhook", body.length);
  return new Response("ok");
}


