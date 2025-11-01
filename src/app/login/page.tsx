"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, Divider, Stack, Typography } from "@mui/material";
import { signIn } from "next-auth/react";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const { login, ready } = usePrivy();
  return (
    <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
      <Card sx={{ width: 420, maxWidth: "100%" }}>
        <CardHeader title="Welcome" subheader="Sign in to continue" />
        <CardContent>
          <Stack spacing={2}>
            <Button variant="contained" size="large" onClick={() => signIn("google", { callbackUrl: "/" })}>Continue with Google</Button>
            <Divider>or</Divider>
            <Button variant="outlined" size="large" onClick={() => login()} disabled={!ready}>Continue with Wallet</Button>
            <Typography variant="body2" color="text.secondary">
              You can link your Google account and wallet later in Settings.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}


