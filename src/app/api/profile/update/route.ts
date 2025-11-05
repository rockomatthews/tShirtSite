import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let userId: string | undefined = (session as any)?.userId || (session as any)?.uid || sessUser?.id;
    const email: string | undefined = sessUser?.email;

    // Ensure we have a DB user. Prefer email upsert; then verify id exists.
    if (email) {
      const u = await db.user.upsert({
        where: { email },
        update: {},
        create: { email, role: "user" },
      });
      userId = u.id;
    }
    if (!userId) return new Response("unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    if (!name) return new Response("bad request", { status: 400 });
    try {
      await db.user.update({ where: { id: userId }, data: { name } });
    } catch {
      // If update-by-id fails for any reason, fall back to email update
      if (email) await db.user.update({ where: { email }, data: { name } });
    }
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`update failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


