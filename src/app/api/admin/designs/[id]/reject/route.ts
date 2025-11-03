import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.design.update({ where: { id }, data: { status: "rejected" } });
  // TODO: send notification to the creator
  return Response.json({ ok: true });
}


