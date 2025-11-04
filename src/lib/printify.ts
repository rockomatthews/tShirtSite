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
      "User-Agent": "tShirtStore/1.0 (+https://vercel.app)",
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

export async function getDefaultShopId(): Promise<string> {
  const envShop = process.env.PRINTIFY_SHOP_ID;
  if (envShop) return envShop;
  const shops = await getShops();
  const id = shops?.[0]?.id ?? shops?.data?.[0]?.id;
  if (!id) throw new Error("No Printify shops found. Set PRINTIFY_SHOP_ID.");
  return String(id);
}

// Upload an image to Printify (multipart/form-data)
export async function uploadImageToPrintify(file: Blob, fileName: string): Promise<{ id: string }> {
  const key = process.env.PRINTIFY_API_KEY;
  if (!key) throw new Error("Missing PRINTIFY_API_KEY");
  const form = new FormData();
  form.append("file", file, fileName);
  form.append("file_name", fileName);
  const res = await fetch(`${BASE_V1}/uploads/images.json`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  return res.json() as Promise<{ id: string }>;
}

export type PrintifyCreateProductArgs = {
  shopId: string;
  title: string;
  description?: string;
  blueprintId: number;
  providerId: number | string;
  variantIds: number[];
  imageId: string;
  placement: { x: number; y: number; scale: number };
};

export async function createPrintifyProduct(args: PrintifyCreateProductArgs) {
  const { shopId, title, description, blueprintId, providerId, variantIds, imageId, placement } = args;
  const payload = {
    title,
    description: description ?? "",
    blueprint_id: Number(blueprintId),
    print_provider_id: providerId,
    variants: variantIds.map((id) => ({ id, price: 2000, is_enabled: true })),
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: "front",
            images: [
              {
                id: imageId,
                x: placement.x,
                y: placement.y,
                scale: placement.scale,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
  } as any;
  return printifyRequest(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PrintifyCreateOrderArgs = {
  shopId: string;
  productId: string;
  variantId: number;
  quantity: number;
  imageId: string; // composed image id with serial
  placement: { x: number; y: number; scale: number };
  recipient: any; // Printify recipient shape
  backOverlay?: { imageId: string; x: number; y: number; scale: number };
  externalId?: string; // our order id for later webhook correlation
};

export async function createPrintifyOrder(args: PrintifyCreateOrderArgs) {
  const { shopId, productId, variantId, quantity, imageId, placement, recipient, backOverlay, externalId } = args;
  const payload = {
    external_id: externalId || `order_${Date.now()}`,
    label: "Website Order",
    line_items: [
      {
        product_id: productId,
        variant_id: variantId,
        quantity,
        print_areas: [
          {
            variant_ids: [variantId],
            placeholders: [
              {
                position: "front",
                images: [
                  { id: imageId, x: placement.x, y: placement.y, scale: placement.scale, angle: 0 },
                ],
              },
              ...(backOverlay ? [{
                position: "back",
                images: [
                  { id: backOverlay.imageId, x: backOverlay.x, y: backOverlay.y, scale: backOverlay.scale, angle: 0 },
                ],
              }] : []),
            ],
          },
        ],
      },
    ],
    recipient,
    send_shipping_notification: false,
  } as any;
  return printifyRequest(`/shops/${shopId}/orders.json`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


