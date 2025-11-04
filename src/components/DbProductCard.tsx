"use client";
import { Card, CardActionArea, CardContent, Typography, Box, Stack } from "@mui/material";

type DbProduct = { id: string; slug: string; title: string; description?: string | null; art?: string | null; placement?: any; price: number };

export function DbProductCard({ product }: { product: DbProduct }) {
  const STAGE_W = 280;
  const STAGE_H = 360;
  const ART_BASE_W = 200;
  const p = product.placement || { x: 0.5, y: 0.38, scale: 0.5, bbox: { x: 0.24, y: 0.20, w: 0.60, h: 0.60 } };
  return (
    <Card>
      <CardActionArea href={`/products/${product.slug}`}>
        <Box sx={{ width: "100%", height: 280, position: "relative", background: "#0b0c10", display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: STAGE_W, height: STAGE_H, position: "relative" }}>
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "#000", WebkitMask: 'url(/blackT.svg) center / contain no-repeat', mask: 'url(/blackT.svg) center / contain no-repeat' }} />
            <Box component="img" src="/blackT.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
            {product.art && (
              <Box component="img" src={product.art} alt="art" sx={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: `translate(-50%,-50%) scale(${p.scale ?? 0.5})`, width: ART_BASE_W }} />
            )}
          </Box>
        </Box>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>{product.title}</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
            <Typography color="text.secondary" variant="body2">{product.description ?? ""}</Typography>
            <Typography fontWeight={700}>${product.price.toFixed(2)}</Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}


