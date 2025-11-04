import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    if (!userId) return new Response("unauthorized", { status: 401 });

    const form = await req.formData();
    const fileUrl = form.get("imageUrl") as string | null;
    const file = form.get("file") as File | null;
    if (!file && !fileUrl) return new Response("bad request", { status: 400 });

    if (fileUrl && /^https?:\/\//.test(fileUrl)) {
      await db.user.update({ where: { id: userId }, data: { image: fileUrl } });
      return Response.json({ ok: true });
    }

    const raw = new Uint8Array(await (file as File).arrayBuffer());
    let outMime = (file.type || "image/png").toLowerCase();
    if (!/^(image\/png|image\/jpeg|image\/webp)$/.test(outMime)) outMime = "image/png";
    let out: Buffer;
    try {
      const pipeline = sharp(Buffer.from(raw)).rotate().resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true });
      if (outMime === "image/jpeg") out = await pipeline.jpeg({ quality: 82 }).toBuffer();
      else if (outMime === "image/webp") out = await pipeline.webp({ quality: 82 }).toBuffer();
      else out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    } catch {
      out = Buffer.from(raw);
    }
    let imageVal: string;
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const filename = `avatars/${userId}-${Date.now()}.webp`;
        const putRes = await blobPut(filename, out, { access: "public", contentType: "image/webp" });
        imageVal = putRes.url;
      } else {
        imageVal = `data:${outMime};base64,${out.toString("base64")}`;
      }
    } catch {
      imageVal = `data:${outMime};base64,${out.toString("base64")}`;
    }
    await db.user.update({ where: { id: userId }, data: { image: imageVal } });
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`avatar upload failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


