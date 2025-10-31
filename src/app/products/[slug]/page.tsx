"use client";
import { Box, Button, Container, Typography, Grid } from "@mui/material";
import { approvedProducts } from "@/lib/mockData";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = approvedProducts.find((p) => p.slug === slug);
  if (!product) return <Container sx={{ py: 4 }}><Typography>Product not found.</Typography></Container>;
  return (
    <Container sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="img" src={product.imageUrl} alt={product.title} sx={{ width: "100%", borderRadius: 2 }} />
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


