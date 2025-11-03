import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { uploadImageToPrintify } from "@/lib/printify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
    const placement = String(form.get("placement") ?? "{}");
    if (!file) return new Response("File required", { status: 400 });

    const uploaded = await uploadImageToPrintify(file, file.name || "art.png");
    const design = await db.design.create({
      data: {
        title,
        description,
        fileKey: `printify:${uploaded.id}`,
        previewKey: `printify:${uploaded.id}`,
        creatorId: userId,
        status: "pending",
        tags: ["placement:" + placement],
      },
    });
    return Response.json({ id: design.id });
  } catch (e: any) {
    return new Response(`Upload failed: ${e?.message ?? "unknown"}`, { status: 502 });
  }
}


