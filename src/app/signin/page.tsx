"use client";
import { SignIn } from "@stackframe/stack";
import { Container, Box, Typography } from "@mui/material";
import { useEffect } from "react";

export default function CustomSignInPage() {
  useEffect(() => {
    // no-op; SignIn component handles flow
  }, []);
  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ maxWidth: 420, mx: "auto" }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Sign in</Typography>
        <SignIn />
      </Box>
    </Container>
  );
}


