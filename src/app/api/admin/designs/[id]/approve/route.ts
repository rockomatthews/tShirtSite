import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { color, maxSupplyPhysical, maxSupplyVirtual } = await req.json();
  await db.design.update({ where: { id: params.id }, data: { status: "approved" } });
  // We only persist approval now; the caps/color will be used during product creation.
  return Response.json({ ok: true, color, maxSupplyPhysical, maxSupplyVirtual });
}


