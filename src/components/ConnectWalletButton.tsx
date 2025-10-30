"use client";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";

export function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    setHasPhantom(typeof window !== "undefined" && !!(window as any).solana);
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("solanaAddress") : null;
    if (saved) setAddress(saved);
  }, []);

  const connect = async () => {
    try {
      const provider = (window as any).solana;
      if (!provider) {
        window.open("https://phantom.app/", "_blank");
        return;
      }
      const res = await provider.connect();
      const pubkey: string = res.publicKey?.toString?.() ?? provider.publicKey?.toString?.();
      if (pubkey) {
        setAddress(pubkey);
        window.localStorage.setItem("solanaAddress", pubkey);
      }
    } catch (e) {
      // swallow for now
    }
  };

  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null;

  return (
    <Button variant="outlined" onClick={connect} color={address ? "success" : (hasPhantom ? "primary" : "inherit") }>
      {address ? short : hasPhantom ? "Connect Wallet" : "Get Phantom"}
    </Button>
  );
}


