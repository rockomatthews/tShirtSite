import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) return new Response("unauthorized", { status: 401 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return new Response("bad request", { status: 400 });
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${file.type || "image/png"};base64,${base64}`;
  await db.user.update({ where: { id: userId }, data: { image: dataUrl } });
  return Response.json({ ok: true });
}


