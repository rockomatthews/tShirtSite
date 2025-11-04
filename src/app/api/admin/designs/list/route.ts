import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { list as blobList } from "@vercel/blob";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const email = (session as any)?.user?.email?.toLowerCase?.() ?? "";
  if (email !== "rob@fastwebwork.com") return new Response("Forbidden", { status: 403 });

  let designs: any[] = [];
  let dbError: string | null = null;
  try {
    designs = await db.design.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, include: { creator: { select: { name: true, email: true } } } });
  } catch (e: any) {
    dbError = e?.message ?? "db error";
  }

  let blobSubmissions: any[] = [];
  let blobError: string | null = null;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blobs = await blobList({ prefix: "submissions/" });
      const recent = blobs.blobs?.slice?.(-100) ?? [];
      const jsons = await Promise.all(recent.map(async (b: any) => {
        try {
          const res = await fetch(b.url);
          return await res.json();
        } catch { return null; }
      }));
      blobSubmissions = jsons.filter(Boolean).map((p: any) => ({
        id: p.id ?? p.createdAt,
        title: p.title ?? "Untitled",
        description: p.description ?? "",
        previewKey: p.previewKey ?? p.fileKey ?? undefined,
        status: p.status ?? "pending",
        tags: p.tags ?? [],
        creator: p.creatorName || p.creatorEmail ? { name: p.creatorName ?? null, email: p.creatorEmail ?? null } : null,
        isBlobOnly: true,
      }));
    }
  } catch (e: any) {
    blobError = e?.message ?? "blob error";
  }

  const all = [...blobSubmissions, ...designs];
  return Response.json({ designs: all, meta: { dbError, blobError } });
}


