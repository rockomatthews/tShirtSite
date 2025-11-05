import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let email: string | undefined = sessUser?.email;
    if (!email) {
      try {
        const token = await getToken({ req: req as any });
        email = (token as any)?.email as string | undefined;
      } catch {}
    }
    if (!email) return new Response("unauthorized: no email", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    if (!name) return new Response("bad request", { status: 400 });
    // Try update by user id first (from token/session), then fall back to email
    let updated = false;
    try {
      const token = await getToken({ req: req as any }).catch(() => null);
      const uid = (token as any)?.uid || (token as any)?.sub || (session as any)?.userId;
      if (uid) {
        await db.user.update({ where: { id: String(uid) }, data: { name } });
        updated = true;
      }
    } catch {}
    if (!updated) {
      const emailLc = email.toLowerCase();
      const existing = await db.user.findFirst({ where: { email: { equals: emailLc, mode: "insensitive" } } }).catch(() => null);
      if (existing) {
        await db.user.update({ where: { id: existing.id }, data: { name, email: emailLc } });
      } else {
        await db.user.create({ data: { email: emailLc, name, role: "user" } });
      }
    }
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`update failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


