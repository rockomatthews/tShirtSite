import { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";
import { dataApiAvailable, dataApiUpsertUserByEmail } from "@/lib/dataApi";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ request: req as any }).catch(() => null);
    const email: string | undefined = (user as any)?.primaryEmail?.emailAddress ?? (user as any)?.email ?? undefined;
    const name: string | null = (user as any)?.name ?? null;
    const image: string | null = (user as any)?.imageUrl ?? null;
    if (!email) return new Response("no user", { status: 401 });
    try {
      if (await dataApiAvailable()) {
        await dataApiUpsertUserByEmail(email, name, image);
      } else {
        await db.user.upsert({
          where: { email },
          update: { name: name ?? undefined, image: image ?? undefined },
          create: { email, name, image, role: "user" },
        });
      }
    } catch {}
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`post-auth failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


