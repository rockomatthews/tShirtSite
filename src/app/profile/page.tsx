"use client";
import { useSession } from "next-auth/react";
import { Avatar, Box, Button, Container, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { approvedProducts } from "@/lib/mockData";

export default function ProfilePage() {
  const { data, update } = useSession();
  const name = data?.user?.name ?? "User";
  const image = data?.user?.image ?? undefined;
  const [editingName, setEditingName] = useState(name);
  const [saving, setSaving] = useState(false);
  const saveName = async () => {
    setSaving(true);
    await fetch("/api/profile/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName }) });
    // Refresh session from token/db so UI reflects the new name
    try { await update?.(); } catch {}
    setSaving(false);
    // Hard reload only if update is unavailable
    if (!update) window.location.reload();
  };
  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={image} sx={{ width: 72, height: 72 }}>{name.charAt(0)}</Avatar>
        <Stack spacing={1} sx={{ minWidth: 280 }}>
          <TextField size="small" label="Display name" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
          <Button size="small" variant="contained" onClick={saveName} disabled={saving || !editingName.trim()}>Save</Button>
        </Stack>
      </Box>
      <Tabs value={0} sx={{ mb: 2 }}>
        <Tab label="Collected" />
        <Tab label="Created" disabled />
      </Tabs>
      <ProductGrid products={approvedProducts} />
    </Container>
  );
}


