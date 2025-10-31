"use client";
import { Grid } from "@mui/material";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <Grid container spacing={2}>
      {products.map((p) => (
        <Grid key={p.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={p} />
        </Grid>
      ))}
    </Grid>
  );
}


