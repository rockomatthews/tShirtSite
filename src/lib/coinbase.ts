import crypto from "crypto";

const BASE = "https://api.commerce.coinbase.com";

export async function coinbaseRequest(path: string, init?: RequestInit) {
  const key = process.env.COINBASE_COMMERCE_API_KEY;
  if (!key) throw new Error("Missing COINBASE_COMMERCE_API_KEY");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CC-Api-Key": key,
      "X-CC-Version": "2018-03-22",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Coinbase error ${res.status}`);
  return res.json();
}

export async function coinbaseCreateCharge(input: {
  name: string;
  description?: string;
  amount: number; // in major units, e.g., 12.34 USD
  currency: string; // e.g., USD
  metadata?: Record<string, any>;
  redirect_url?: string;
  cancel_url?: string;
}) {
  return coinbaseRequest(`/charges`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? "",
      local_price: { amount: (input.amount).toFixed(2), currency: input.currency },
      pricing_type: "fixed_price",
      metadata: input.metadata ?? {},
      redirect_url: input.redirect_url,
      cancel_url: input.cancel_url,
    }),
  });
}

export function verifyCoinbaseWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing COINBASE_COMMERCE_WEBHOOK_SECRET");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
}


