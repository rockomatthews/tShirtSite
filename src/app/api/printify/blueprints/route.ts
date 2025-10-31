import { NextRequest } from "next/server";
import { getBlueprintsV2 } from "@/lib/printify";

export async function GET(_req: NextRequest) {
  const data = await getBlueprintsV2();
  return Response.json(data);
}


