import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let email: string | undefined = sessUser?.email;
    if (!email) {
      const token = await getToken({ req: req as any }).catch(() => null);
      email = (token as any)?.email as string | undefined;
    }
    if (!email) return new Response("unauthorized: no email", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    if (!name) return new Response("bad request", { status: 400 });

    // Try Data API first
    try {
      const { dataApiAvailable, dataApiPatchUserByEmail, dataApiInsertUser } = await import("@/lib/dataApi");
      if (await dataApiAvailable()) {
        const patched = await dataApiPatchUserByEmail(email, { name });
        if (!patched || (Array.isArray(patched) && patched.length === 0)) {
          await dataApiInsertUser({ email: email.toLowerCase(), name, role: "user" });
        }
        return Response.json({ ok: true });
      }
    } catch {}

    // Fallback to Prisma
    const existing = await db.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) await db.user.update({ where: { id: existing.id }, data: { name } });
    else await db.user.create({ data: { email: email.toLowerCase(), name, role: "user" } });
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`set name failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


