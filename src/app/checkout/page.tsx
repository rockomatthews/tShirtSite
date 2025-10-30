"use client";
import { Container, Typography, Tabs, Tab, Box } from "@mui/material";
import { useState } from "react";

export default function CheckoutPage() {
  const [method, setMethod] = useState<"card" | "crypto">("card");
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Checkout
      </Typography>
      <Tabs value={method} onChange={(_, v) => setMethod(v)} sx={{ mb: 2 }}>
        <Tab value="card" label="Credit Card" />
        <Tab value="crypto" label="Crypto" />
      </Tabs>
      <Box>
        {method === "card" ? (
          <Typography color="text.secondary">Stripe Payment Element goes here.</Typography>
        ) : (
          <Typography color="text.secondary">BitPay button goes here.</Typography>
        )}
      </Box>
    </Container>
  );
}


