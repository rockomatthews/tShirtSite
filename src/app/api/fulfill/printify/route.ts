import { NextRequest } from "next/server";
import { createPrintifyOrder, getDefaultShopId, uploadImageToPrintify } from "@/lib/printify";
import { composeSerialPng } from "@/lib/serial";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const productId = String(form.get("productId") ?? "");
  const variantId = Number(form.get("variantId") ?? 0);
  const quantity = Number(form.get("quantity") ?? 1);
  const placement = JSON.parse(String(form.get("placement") ?? "{}"));
  const recipient = JSON.parse(String(form.get("recipient") ?? "{}"));
  const file = form.get("file") as File | null; // optional pre-composed image with serial number
  const baseUrl = form.get("baseImageUrl") as string | null;
  const serialNumber = form.get("serialNumber") as string | null;
  if (!productId || !variantId) return new Response("bad request", { status: 400 });

  const shopId = await getDefaultShopId();
  let uploadId: string;
  if (file) {
    const up = await uploadImageToPrintify(file, file.name || "serial.png");
    uploadId = up.id;
  } else if (baseUrl && serialNumber) {
    const baseResp = await fetch(baseUrl);
    if (!baseResp.ok) return new Response("base image fetch failed", { status: 400 });
    const baseBuf = Buffer.from(await baseResp.arrayBuffer());
    const composed = await composeSerialPng(baseBuf, serialNumber);
    const uint8 = new Uint8Array(composed.buffer, composed.byteOffset, composed.byteLength);
    const ab = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: "image/png" });
    const fileForUpload = new File([blob], `serial-${serialNumber}.png`, { type: "image/png" });
    const up = await uploadImageToPrintify(fileForUpload, fileForUpload.name);
    uploadId = up.id;
  } else {
    return new Response("missing file or baseImageUrl+serialNumber", { status: 400 });
  }
  const order = await createPrintifyOrder({
    shopId,
    productId,
    variantId,
    quantity,
    imageId: uploadId,
    placement,
    recipient,
  });
  return Response.json(order);
}


