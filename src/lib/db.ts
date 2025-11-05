import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function withNeonParams(urlRaw: string | undefined): string | undefined {
  if (!urlRaw) return urlRaw;
  try {
    const u = new URL(urlRaw);
    // Ensure ssl and pgbouncer hints for serverless + Neon pooler
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "30");
    return u.toString();
  } catch {
    return urlRaw;
  }
}

const runtimeUrl = withNeonParams(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL);

export const db = global.prisma ?? new PrismaClient({ datasources: { db: { url: runtimeUrl } } as any });
if (process.env.NODE_ENV !== "production") global.prisma = db;


