"use client";
import { Container, Typography } from "@mui/material";
import { ProductGrid } from "@/components/ProductGrid";
import { approvedProducts } from "@/lib/mockData";

export default function ProductsPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        All Products
      </Typography>
      <ProductGrid products={approvedProducts} />
    </Container>
  );
}


