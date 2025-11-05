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
    // Prefer Neon driver for resilience in serverless runtime
    // Prefer Data API if configured
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
    try {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        await db.user.update({ where: { id: existing.id }, data: { name } });
      } else {
        await db.user.create({ data: { email: email.toLowerCase(), name, role: "user" } });
      }
      return Response.json({ ok: true });
    } catch (e: any) {
      throw e;
    }
  } catch (e: any) {
    const msg = e?.message ?? "unknown";
    const stack = e?.stack ?? "";
    return new Response(`update failed: ${msg}\n${stack}`, { status: 500 });
  }
}


