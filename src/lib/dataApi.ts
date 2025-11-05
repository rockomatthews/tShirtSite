// Minimal Neon Data API (PostgREST) helper

function getBase(): string | null {
  const base = process.env.NEON_DATA_API_URL || process.env.NEXT_PUBLIC_NEON_DATA_API_URL || null;
  return base ? base.replace(/\/$/, "") : null;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const bearer = process.env.NEON_DATA_API_KEY || process.env.NEON_AUTH_BEARER;
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  return headers;
}

export async function dataApiAvailable(): Promise<boolean> {
  return Boolean(getBase());
}

export async function dataApiPatchUserByEmail(email: string, fields: any): Promise<any | null> {
  const base = getBase();
  if (!base) return null;
  const urls = [
    `${base}/User?email=eq.${encodeURIComponent(email)}`,
    `${base}/users?email=eq.${encodeURIComponent(email)}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { ...authHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(fields),
      cache: "no-store",
    });
    if (res.ok) {
      try { return await res.json(); } catch { return null; }
    }
  }
  return null;
}

export async function dataApiInsertUser(record: any): Promise<any | null> {
  const base = getBase();
  if (!base) return null;
  const paths = ["User", "users"]; // try both quoted table and lowercase view
  for (const p of paths) {
    const res = await fetch(`${base}/${p}`, {
      method: "POST",
      headers: { ...authHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(record),
      cache: "no-store",
    });
    if (res.ok) {
      try { return await res.json(); } catch { return null; }
    }
  }
  return null;
}

export async function dataApiUpsertUserByEmail(email: string, name?: string | null, image?: string | null): Promise<void> {
  const lower = email.toLowerCase();
  const patched = await dataApiPatchUserByEmail(lower, { name: name ?? null, image: image ?? null });
  if (Array.isArray(patched) && patched.length > 0) return;
  await dataApiInsertUser({ email: lower, name: name ?? null, image: image ?? null, role: "user" });
}


