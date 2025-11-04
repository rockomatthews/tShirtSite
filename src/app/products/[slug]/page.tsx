"use client";
import { Box, Button, Container, Typography, Grid } from "@mui/material";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = useSWR(`/api/products?slug=${encodeURIComponent(slug)}`, fetcher);
  const product = (data?.products ?? []).find((p: any) => p.slug === slug);
  if (!product) return <Container sx={{ py: 4 }}><Typography>Product not found.</Typography></Container>;
  const p = product.placement || { x: 0.5, y: 0.38, scale: 0.5, bbox: { x: 0.24, y: 0.20, w: 0.60, h: 0.60 } };
  const ART_BASE_W = 320;
  return (
    <Container sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ width: "100%", aspectRatio: "3/4", position: "relative", background: "#0b0c10", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "#000", WebkitMask: 'url(/blackT.svg) center / contain no-repeat', mask: 'url(/blackT.svg) center / contain no-repeat' }} />
            <Box component="img" src="/blackT.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
            {product.art && (
              <Box component="img" src={product.art} alt="art" sx={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: `translate(-50%,-50%) scale(${p.scale ?? 0.5})`, width: ART_BASE_W }} />
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>{product.title}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{product.description}</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>${product.price.toFixed(2)}</Typography>
          <Button variant="contained" size="large">Add to Cart</Button>
        </Grid>
      </Grid>
    </Container>
  );
}


