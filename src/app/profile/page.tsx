"use client";
import { useSession } from "next-auth/react";
import { Avatar, Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { ProductGrid } from "@/components/ProductGrid";
import { approvedProducts } from "@/lib/mockData";

export default function ProfilePage() {
  const { data } = useSession();
  const name = data?.user?.name ?? "User";
  const image = data?.user?.image ?? undefined;
  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={image} sx={{ width: 72, height: 72 }}>{name.charAt(0)}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{name}</Typography>
          <Typography color="text.secondary">Collector & Designer</Typography>
        </Box>
      </Box>
      <Tabs value={0} sx={{ mb: 2 }}>
        <Tab label="Collected" />
        <Tab label="Created" disabled />
      </Tabs>
      <ProductGrid products={approvedProducts} />
    </Container>
  );
}


