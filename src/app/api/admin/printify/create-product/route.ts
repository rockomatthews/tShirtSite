import { NextRequest } from "next/server";
import { createPrintifyProduct, getDefaultShopId, uploadImageToPrintify } from "@/lib/printify";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const title = String(form.get("title") ?? "Untitled Tee");
  const blueprintId = Number(form.get("blueprintId"));
  const providerId = String(form.get("providerId"));
  const placement = JSON.parse(String(form.get("placement") ?? "{}"));
  const file = form.get("file") as File | null;
  if (!blueprintId || !providerId || !file) return new Response("bad request", { status: 400 });

  const shopId = await getDefaultShopId();
  const upload = await uploadImageToPrintify(file, file.name || "art.png");
  const product = await createPrintifyProduct({
    shopId,
    title,
    description: "",
    blueprintId,
    providerId,
    variantIds: JSON.parse(String(form.get("variantIds") ?? "[]")),
    imageId: upload.id,
    placement,
  });
  return Response.json({ shopId, product });
}


