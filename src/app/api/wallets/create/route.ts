import { NextRequest } from "next/server";
import { ensureEmailWallet } from "@/lib/crossmint";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return new Response("bad request", { status: 400 });
  try {
    const out = await ensureEmailWallet({ email });
    return Response.json(out);
  } catch (e: any) {
    return new Response(e?.message ?? "wallet create failed", { status: 500 });
  }
}


