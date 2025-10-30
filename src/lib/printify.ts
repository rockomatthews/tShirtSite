const BASE = "https://api.printify.com/v1";

export async function printifyRequest(path: string, init?: RequestInit) {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error("Missing PRINTIFY_API_KEY");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Printify error ${res.status}`);
  return res.json();
}


