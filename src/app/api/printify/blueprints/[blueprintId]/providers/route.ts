import { NextRequest } from "next/server";
import { getProvidersForBlueprintV2 } from "@/lib/printify";

export async function GET(_req: NextRequest, { params }: { params: { blueprintId: string } }) {
  const data = await getProvidersForBlueprintV2(params.blueprintId);
  return Response.json(data);
}


