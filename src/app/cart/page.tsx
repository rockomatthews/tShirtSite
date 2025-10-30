"use client";
import { Container, Typography } from "@mui/material";

export default function CartPage() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Cart
      </Typography>
      <Typography color="text.secondary">Your cart is empty.</Typography>
    </Container>
  );
}


