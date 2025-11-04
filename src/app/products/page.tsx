"use client";
import { Container, Grid, Typography } from "@mui/material";
import useSWR from "swr";
import { DbProductCard } from "@/components/DbProductCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ProductsPage() {
  const { data } = useSWR("/api/products", fetcher);
  const products = data?.products ?? [];
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        All Products
      </Typography>
      <Grid container spacing={2}>
        {products.map((p: any) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <DbProductCard product={p} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}


