import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { uploadImageToPrintify } from "@/lib/printify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.userId ?? null;
  const form = await req.formData();
  const title = String(form.get("title") ?? "Untitled Design");
  const description = String(form.get("description") ?? "");
  const file = form.get("file") as File | null;
  if (!file || !userId) return new Response("Unauthorized or bad request", { status: 400 });

  const uploaded = await uploadImageToPrintify(file, file.name || "art.png");
  const design = await db.design.create({
    data: {
      title,
      description,
      fileKey: `printify:${uploaded.id}`,
      previewKey: `printify:${uploaded.id}`,
      creatorId: userId,
      status: "pending",
      tags: [],
    },
  });
  return Response.json({ id: design.id });
}


