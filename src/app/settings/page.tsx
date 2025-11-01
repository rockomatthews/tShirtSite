"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, Typography } from "@mui/material";
import { useSession, signIn } from "next-auth/react";
import { usePrivy } from "@privy-io/react-auth";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export default function SettingsPage() {
  const session = useSession();
  const { user, linkEmail, linkWallet } = usePrivy();

  return (
    <Container sx={{ py: 6 }}>
      <Card sx={{ maxWidth: 720 }}>
        <CardHeader title="Account Settings" />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Google</Typography>
              {session.status === "authenticated" ? (
                <Typography color="success.main">Linked as {session.data.user?.email}</Typography>
              ) : (
                <Button variant="outlined" onClick={() => signIn("google")}>Link Google</Button>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Wallet</Typography>
              {user?.wallet ? (
                <Typography color="success.main">Linked: {user.wallet.address}</Typography>
              ) : (
                <>
                  <Button variant="outlined" onClick={() => linkWallet?.()}>Link via Privy</Button>
                  <Box sx={{ mt: 1 }}><ConnectWalletButton /></Box>
                </>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}


