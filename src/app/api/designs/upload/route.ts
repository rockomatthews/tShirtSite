import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
import sharp from "sharp";
import { put as blobPut } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const sessUser = (session as any)?.user ?? {};
    let userId: string | undefined = (session as any)?.userId || sessUser?.id;
    if (!userId) {
      const email: string | undefined = sessUser?.email;
      if (email) {
        const u = await db.user.upsert({
          where: { email },
          update: { name: sessUser?.name ?? undefined, image: sessUser?.image ?? undefined },
          create: { email, name: sessUser?.name ?? null, image: sessUser?.image ?? null, role: "user" },
        });
        userId = u.id;
      }
    }
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const form = await req.formData();
    const title = String(form.get("title") ?? "Untitled Design");
    const description = String(form.get("description") ?? "");
    const file = form.get("file") as File | null;
    const placementRaw = String(form.get("placement") ?? "{}");
    if (!file) return new Response("File required", { status: 400 });

    // Store submission only for admin review; limit payload size
    const raw = new Uint8Array(await file.arrayBuffer());
    const tooLarge = raw.byteLength > 6_000_000; // ~6MB guard
    // Always convert to WebP and cap width for storage+transport
    let previewBytes: Buffer;
    try {
      const pipeline = sharp(Buffer.from(raw)).rotate().resize({ width: tooLarge ? 1280 : 1280, withoutEnlargement: true });
      previewBytes = await pipeline.webp({ quality: 80 }).toBuffer();
    } catch {
      previewBytes = Buffer.from(raw);
    }
    let fileKey: string;
    let previewKey: string;
    try {
      // Prefer Vercel Blob if token configured
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const filename = `designs/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const putRes = await blobPut(filename, previewBytes, { access: "public", contentType: "image/webp" });
        fileKey = putRes.url;
        previewKey = putRes.url;
      } else {
        const dataUrl = `data:image/webp;base64,${previewBytes.toString("base64")}`;
        fileKey = dataUrl;
        previewKey = dataUrl;
      }
    } catch {
      const dataUrl = `data:image/webp;base64,${previewBytes.toString("base64")}`;
      fileKey = dataUrl;
      previewKey = dataUrl;
    }

    // We keep placement inside tags for now to avoid DB migration timing issues
    const placementTag = `placement:${placementRaw}`;
    const sizeTag = `bytes:${raw.byteLength}`;
    const originalTag = tooLarge ? "needsOriginalOnApproval:true" : "needsOriginalOnApproval:false";
    const design = await db.design.create({
      data: {
        title,
        description,
        fileKey,
        previewKey,
        creatorId: userId,
        status: "pending",
        tags: [placementTag, sizeTag, originalTag],
      },
    });
    return Response.json({ id: design.id });
  } catch (e: any) {
    return new Response(`Upload failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


