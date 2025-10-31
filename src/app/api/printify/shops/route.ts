import { NextRequest } from "next/server";
import { getShops } from "@/lib/printify";

export async function GET(_req: NextRequest) {
  const data = await getShops();
  return Response.json(data);
}


