"use client";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Box, Button, Stack } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export function Header() {
  const session = useSession();
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" fontWeight={800} component={Link} href="/" sx={{ textDecoration: "none", color: "inherit" }}>
          TeeHaus
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/products">Products</Button>
          <Button component={Link} href="/submit">Submit</Button>
          <Button component={Link} href="/cart">Cart</Button>
          <ConnectWalletButton />
          {session.status === "authenticated" ? (
            <Button onClick={() => signOut()}>{session.data.user?.name ?? "Sign out"}</Button>
          ) : (
            <Button onClick={() => signIn("google")}>Sign in</Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}


