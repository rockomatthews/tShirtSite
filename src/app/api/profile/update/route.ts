import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { getSql } from "@/lib/neon";

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
    const sql: any = await getSql();
    await sql('UPDATE "User" SET name = $2 WHERE lower(email) = lower($1)', [email, name]);
    return Response.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "unknown";
    const stack = e?.stack ?? "";
    return new Response(`update failed: ${msg}\n${stack}`, { status: 500 });
  }
}


