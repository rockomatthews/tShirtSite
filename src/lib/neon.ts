// Minimal Neon serverless helper for direct SQL when Prisma is unavailable
export async function getSql() {
  const { neon } = await import("@neondatabase/serverless");
  const url = process.env.DATABASE_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.POSTGRES_URL_NO_SSL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url as string) as any;
}


