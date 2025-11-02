"use client";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Box, Button, Stack, IconButton, Drawer, List, ListItemButton, ListItemText, Divider, Avatar } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

export function Header() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const email = session.data?.user?.email ?? "";
  const isOwner = email.toLowerCase() === "rob@fastwebwork.com";
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2 }}>
        {/* Mobile: hamburger, Desktop: logo text */}
        <IconButton onClick={() => setOpen(true)} sx={{ display: { xs: "inline-flex", md: "none" } }} aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800} component={Link} href="/" sx={{ textDecoration: "none", color: "inherit", display: { xs: "none", md: "inline" } }}>
          TeeHaus
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "inline-flex" }, gap: 1 }}>
            <Button component={Link} href="/products">Products</Button>
            <Button component={Link} href="/submit">Submit</Button>
            {isOwner && <Button component={Link} href="/(admin)/products/new">Admin</Button>}
            <Button component={Link} href="/cart">Cart</Button>
            <ConnectWalletButton />
          </Box>
          {/* Auth */}
          {session.status === "authenticated" ? (
            <IconButton component={Link} href="/profile" aria-label="profile">
              <Avatar src={session.data.user?.image ?? undefined}>{(session.data.user?.name ?? "U").charAt(0)}</Avatar>
            </IconButton>
          ) : (
            <Button component={Link} href="/login">Sign in</Button>
          )}
        </Stack>
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer open={open} onClose={close} sx={{ display: { xs: "block", md: "none" } }}>
        <Box role="presentation" sx={{ width: 280 }} onClick={close}>
          <List>
            <ListItemButton component={Link} href="/products"><ListItemText primary="Products" /></ListItemButton>
            <ListItemButton component={Link} href="/submit"><ListItemText primary="Submit Art" /></ListItemButton>
            <ListItemButton component={Link} href="/cart"><ListItemText primary="Cart" /></ListItemButton>
            {isOwner && <ListItemButton component={Link} href="/(admin)/products/new"><ListItemText primary="Admin" /></ListItemButton>}
            {session.status === "authenticated" && (
              <>
                <Divider />
                <ListItemButton component={Link} href="/profile"><ListItemText primary="Profile" /></ListItemButton>
                <ListItemButton component={Link} href="/settings"><ListItemText primary="Settings" /></ListItemButton>
                <ListItemButton onClick={() => signOut()}><ListItemText primary="Sign out" /></ListItemButton>
              </>
            )}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <ConnectWalletButton />
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}


