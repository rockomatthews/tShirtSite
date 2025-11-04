import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { list as blobList } from "@vercel/blob";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any).catch(() => null);
    const email = (session as any)?.user?.email?.toLowerCase?.() ?? "";
    if (email !== "rob@fastwebwork.com") return new Response("Forbidden", { status: 403 });
    const designs = await db.design.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" } });
    // Also include any Blob-saved submissions if DB was down when submitted
    let blobSubmissions: any[] = [];
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
          isBlobOnly: true,
        }));
      }
    } catch {}
    const all = [...blobSubmissions, ...designs];
    return Response.json({ designs: all });
  } catch (e: any) {
    return new Response(`List failed: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}


