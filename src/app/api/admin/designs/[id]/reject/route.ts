import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.design.update({ where: { id: params.id }, data: { status: "rejected" } });
  // TODO: send notification to the creator
  return Response.json({ ok: true });
}


