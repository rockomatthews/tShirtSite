type MintArgs = { orderItemId: string; recipient: string };

type CreateEmailWalletArgs = { email: string };

export async function ensureEmailWallet({ email }: CreateEmailWalletArgs) {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("Missing CROSSMINT_API_KEY");
  // Placeholder: Call Crossmint to create/get a wallet for the email
  const res = await fetch("https://www.crossmint.com/api/placeholder/wallets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Crossmint wallet error ${res.status}`);
  return await res.json();
}

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


