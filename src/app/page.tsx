"use client";
import { Container, Box, Typography, Card, CardMedia, CardContent, Button, Grid } from "@mui/material";
import { ProductGrid } from "@/components/ProductGrid";
import { featuredProduct, approvedProducts } from "@/lib/mockData";

export default function Home() {
  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Featured
        </Typography>
        <Card sx={{ display: "flex", overflow: "hidden" }}>
          <CardMedia
            component="img"
            image={featuredProduct.imageUrl}
            alt={featuredProduct.title}
            sx={{ width: { xs: 160, md: 280 }, height: "100%", objectFit: "cover" }}
          />
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {featuredProduct.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {featuredProduct.description}
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size="auto">
                <Typography variant="h6">${featuredProduct.price.toFixed(2)}</Typography>
              </Grid>
              <Grid size="auto">
                <Button variant="contained">View</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Latest approved designs
      </Typography>
      <ProductGrid products={approvedProducts} />
    </Container>
  );
}
