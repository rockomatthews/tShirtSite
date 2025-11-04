import { NextRequest } from "next/server";
import { put as blobPut } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("filename") || `upload-${Date.now()}.bin`;
    const contentType = req.headers.get("content-type") || "application/octet-stream";
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return new Response("Blob token not configured", { status: 500 });
    }
    const res = await blobPut(`uploads/${fileName}`, req.body as any, { access: "public", contentType });
    return Response.json({ url: res.url });
  } catch (e: any) {
    return new Response(`blob upload failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


