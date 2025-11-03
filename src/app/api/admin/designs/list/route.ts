import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const email = (session as any)?.user?.email?.toLowerCase?.() ?? "";
    if (email !== "rob@fastwebwork.com") return new Response("Forbidden", { status: 403 });
    const designs = await db.design.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } });
    return Response.json({ designs });
  } catch (e: any) {
    return new Response(`List failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


