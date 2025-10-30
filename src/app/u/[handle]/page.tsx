"use client";
import { Avatar, Box, Container, Grid, Tab, Tabs, Typography } from "@mui/material";
import { ProductGrid } from "@/components/ProductGrid";
import { approvedProducts } from "@/lib/mockData";

export default function ProfilePage({ params }: { params: { handle: string } }) {
  const handle = decodeURIComponent(params.handle);
  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 72, height: 72 }}>{handle[1]?.toUpperCase() ?? "U"}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{handle}</Typography>
          <Typography color="text.secondary">Designer • Joined 2025</Typography>
        </Box>
      </Box>
      <Tabs value={0} sx={{ mb: 2 }}>
        <Tab label="Designs" />
        <Tab label="Collections" disabled />
      </Tabs>
      <ProductGrid products={approvedProducts} />
    </Container>
  );
}


