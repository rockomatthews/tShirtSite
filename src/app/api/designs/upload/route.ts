import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
import sharp from "sharp";

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
    let outMime = (file.type || "image/png").toLowerCase();
    if (!/^(image\/png|image\/jpeg|image\/webp)$/.test(outMime)) outMime = "image/png";
    let previewBytes: Buffer;
    try {
      if (tooLarge) {
        // Resize large images for preview to reduce DB payload
        const pipeline = sharp(Buffer.from(raw)).rotate();
        if (outMime === "image/jpeg") previewBytes = await pipeline.jpeg({ quality: 80 }).resize({ width: 1600, withoutEnlargement: true }).toBuffer();
        else if (outMime === "image/webp") previewBytes = await pipeline.webp({ quality: 80 }).resize({ width: 1600, withoutEnlargement: true }).toBuffer();
        else previewBytes = await pipeline.png({ compressionLevel: 9 }).resize({ width: 1600, withoutEnlargement: true }).toBuffer();
      } else {
        previewBytes = Buffer.from(raw);
      }
    } catch {
      previewBytes = Buffer.from(raw);
    }
    const dataUrl = `data:${outMime};base64,${previewBytes.toString("base64")}`;
    const fileKey = dataUrl;
    const previewKey = dataUrl;

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


