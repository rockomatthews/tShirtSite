"use client";
import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;
  return (
    <PrivyProvider appId={appId} config={{
      // Enable Solana by default; EVM can be enabled later
      supportedChains: { solana: { devnet: true, mainnet: true } },
      appearance: { theme: "light" },
    }}>
      {children}
    </PrivyProvider>
  );
}


