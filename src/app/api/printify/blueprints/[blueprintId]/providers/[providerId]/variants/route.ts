import { NextRequest } from "next/server";
import { getVariantsForProviderV1 } from "@/lib/printify";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ blueprintId: string; providerId: string }> }) {
  const { blueprintId, providerId } = await ctx.params;
  const data = await getVariantsForProviderV1(blueprintId, providerId);
  return Response.json(data);
}


