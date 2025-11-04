type MintArgs = { collectionId: string; recipient: string; metadata: any };

type CreateEmailWalletArgs = { email: string };

export async function ensureEmailWallet({ email }: CreateEmailWalletArgs) {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("Missing CROSSMINT_API_KEY");
  // Create/get email wallet
  const res = await fetch("https://www.crossmint.com/api/2022-06-09/wallets/email", {
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

export async function createCollection({ name, image, description }: { name: string; image?: string | null; description?: string | null }) {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("Missing CROSSMINT_API_KEY");
  const res = await fetch("https://www.crossmint.com/api/2022-06-09/collections/solana", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({ chain: "solana", name, description: description ?? undefined, image }),
  });
  if (!res.ok) throw new Error(`Crossmint collection error ${res.status}`);
  return res.json();
}

export async function crossmintMint(args: MintArgs) {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) throw new Error("Missing CROSSMINT_API_KEY");
  const res = await fetch(`https://www.crossmint.com/api/2022-06-09/collections/solana/${args.collectionId}/nfts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({ recipient: args.recipient.startsWith("email:") ? args.recipient : `email:${args.recipient}`, metadata: args.metadata }),
  });
  if (!res.ok) throw new Error(`Crossmint mint error ${res.status}`);
  return res.json();
}


