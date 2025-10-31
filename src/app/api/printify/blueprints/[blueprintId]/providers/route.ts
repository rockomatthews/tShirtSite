import { NextRequest } from "next/server";
import { getProvidersForBlueprintV2 } from "@/lib/printify";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ blueprintId: string }> }) {
  const { blueprintId } = await ctx.params;
  const data = await getProvidersForBlueprintV2(blueprintId);
  return Response.json(data);
}


