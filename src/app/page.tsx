"use client";
import { Container, Box, Typography, Card, CardMedia, CardContent, Button } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
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
            <Grid2 container spacing={2} alignItems="center">
              <Grid2 xs="auto">
                <Typography variant="h6">${featuredProduct.price.toFixed(2)}</Typography>
              </Grid2>
              <Grid2 xs="auto">
                <Button variant="contained">View</Button>
              </Grid2>
            </Grid2>
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
