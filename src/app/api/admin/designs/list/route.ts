import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const designs = await db.design.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } });
  return Response.json({ designs });
}


