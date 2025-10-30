type MintArgs = { orderItemId: string; recipient: string };

export async function crossmintMint(args: MintArgs) {
  // Placeholder: Call Crossmint mint API after building metadata
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("Missing CROSSMINT_API_KEY");
  // In production, build metadataUri + creators + royaltyBps, etc.
  const res = await fetch("https://www.crossmint.com/api/placeholder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ orderItemId: args.orderItemId, recipient: args.recipient }),
  });
  if (!res.ok) throw new Error(`Crossmint error ${res.status}`);
  return await res.json();
}


