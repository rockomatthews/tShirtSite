"use client";
import { Card, CardActionArea, CardContent, CardMedia, Typography, Stack } from "@mui/material";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardActionArea href={`/products/${product.slug}`}>
        <CardMedia component="img" height="220" image={product.imageUrl} alt={product.title} />
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {product.title}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
            <Typography color="text.secondary" variant="body2">
              by {product.creatorHandle}
            </Typography>
            <Typography fontWeight={700}>${product.price.toFixed(2)}</Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}


