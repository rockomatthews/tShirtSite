const BASE_V1 = "https://api.printify.com/v1";
const BASE_V2 = "https://api.printify.com/v2";

export async function printifyRequest(path: string, init?: RequestInit) {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error("Missing PRINTIFY_API_KEY");
  const base = path.startsWith("/v2/") ? "" : BASE_V1;
  const full = path.startsWith("/v2/") ? `${BASE_V2}${path.replace("/v2", "")}` : `${BASE_V1}${path}`;
  const res = await fetch(full, {
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

export async function getShops() {
  return printifyRequest(`/shops.json`);
}

export async function getBlueprintsV2() {
  return printifyRequest(`/v2/catalog/blueprints.json`);
}

export async function getProvidersForBlueprintV2(blueprintId: number | string) {
  return printifyRequest(`/v2/catalog/blueprints/${blueprintId}/print_providers.json`);
}

export async function getVariantsForProviderV1(blueprintId: number | string, providerId: number | string) {
  return printifyRequest(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}.json`);
}


