import { NextRequest } from "next/server";
import { getVariantsForProviderV1 } from "@/lib/printify";

export async function GET(_req: NextRequest, { params }: { params: { blueprintId: string; providerId: string } }) {
  const data = await getVariantsForProviderV1(params.blueprintId, params.providerId);
  return Response.json(data);
}


