import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { uploadImageToPrintify } from "@/lib/printify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    let userId: string | undefined = (session as any)?.user?.id;
    if (!userId) {
      const email = (session as any)?.user?.email ?? null;
      if (email) {
        const u = await db.user.findUnique({ where: { email: String(email) } }).catch(() => null);
        userId = u?.id;
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


