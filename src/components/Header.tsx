"use client";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Box, Button, Stack, IconButton, Drawer, List, ListItemButton, ListItemText, Divider, Avatar, Menu, MenuItem } from "@mui/material";
import { signIn, signOut, useSession } from "next-auth/react";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useRef } from "react";

export function Header() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const email = session.data?.user?.email ?? "";
  const isOwner = email.toLowerCase() === "rob@fastwebwork.com";
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuAnchor);
  const onAvatarClick = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const onAvatarEnter = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onUploadClick = () => fileInputRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const uploadRes = await fetch(`/api/uploads/blob?filename=${encodeURIComponent(f.name)}`, {
      method: "POST",
      headers: { "content-type": f.type || "application/octet-stream" },
      body: f,
    });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      const fd = new FormData();
      fd.append("imageUrl", url);
      await fetch("/api/profile/avatar", { method: "POST", body: fd });
    }
    closeMenu();
    window.location.reload();
  };
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ gap: 2 }}>
        {/* Mobile: hamburger, Desktop: logo image */}
        <IconButton onClick={() => setOpen(true)} sx={{ display: { xs: "inline-flex", md: "none" } }} aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Box component={Link} href="/" sx={{ display: { xs: "none", md: "inline-flex" }, alignItems: "center" }}>
          <Box component="img" src="/hangerSolo.png" alt="HANGER.Graphics" sx={{ height: 36, width: "auto" }} />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "inline-flex" }, gap: 1 }}>
            <Button component={Link} href="/shop">Shop</Button>
            <Button component={Link} href="/design">Design</Button>
            {isOwner && (
              <>
                <Button component={Link} href="/products/new">Admin</Button>
                <Button component={Link} href="/designs">Reviews</Button>
              </>
            )}
            <Button component={Link} href="/cart">Cart</Button>
            <ConnectWalletButton />
          </Box>
          {/* Auth */}
          {session.status === "authenticated" ? (
            <>
              <IconButton aria-label="profile" onClick={onAvatarClick} onMouseEnter={onAvatarEnter}>
                <Avatar src={session.data.user?.image ?? undefined}>{(session.data.user?.name ?? "U").charAt(0)}</Avatar>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={openMenu}
                onClose={closeMenu}
                MenuListProps={{ onMouseLeave: closeMenu }}
              >
                <MenuItem component={Link} href="/profile" onClick={closeMenu}>Profile</MenuItem>
                <MenuItem onClick={onUploadClick}>Upload photo</MenuItem>
                <MenuItem onClick={() => { closeMenu(); signOut(); }}>Logout</MenuItem>
              </Menu>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFile} />
            </>
          ) : (
            <Button component={Link} href="/login">Sign in</Button>
          )}
        </Stack>
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer open={open} onClose={close} sx={{ display: { xs: "block", md: "none" } }}>
        <Box role="presentation" sx={{ width: 280 }} onClick={close}>
          <List>
            <ListItemButton component={Link} href="/shop"><ListItemText primary="Shop" /></ListItemButton>
                <ListItemButton component={Link} href="/design"><ListItemText primary="Design" /></ListItemButton>
            <ListItemButton component={Link} href="/cart"><ListItemText primary="Cart" /></ListItemButton>
            {isOwner && (
              <>
                <ListItemButton component={Link} href="/products/new"><ListItemText primary="Admin" /></ListItemButton>
                <ListItemButton component={Link} href="/designs"><ListItemText primary="Reviews" /></ListItemButton>
              </>
            )}
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


