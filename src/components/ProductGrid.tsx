"use client";
import Grid2 from "@mui/material/Unstable_Grid2";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <Grid2 container spacing={2}>
      {products.map((p) => (
        <Grid2 key={p.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={p} />
        </Grid2>
      ))}
    </Grid2>
  );
}


