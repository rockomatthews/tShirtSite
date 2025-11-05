import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let email: string | undefined = sessUser?.email;
    if (!email) {
      const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
      email = (token as any)?.email as string | undefined;
    }
    if (!email) return new Response("unauthorized: no email", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    if (!name) return new Response("bad request", { status: 400 });
    // Upsert by email to avoid id mismatch issues
    await db.user.upsert({ where: { email }, update: { name }, create: { email, name, role: "user" } });
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`update failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


