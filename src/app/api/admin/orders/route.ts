import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const email = (session as any)?.user?.email?.toLowerCase?.() ?? "";
  if (email !== "rob@fastwebwork.com") return new Response("Forbidden", { status: 403 });
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: { include: { productVariant: { include: { product: { include: { design: true } } } } } } } });
  return Response.json({ orders });
}


