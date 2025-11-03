"use client";
import useSWR from "swr";
import { Box, Card, CardContent, CardHeader, Chip, Container, Stack, Typography } from "@mui/material";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function OrdersAdminPage() {
  const { data } = useSWR("/api/admin/orders", fetcher);
  const orders = data?.orders ?? [];
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Orders</Typography>
      <Stack spacing={2}>
        {orders.map((o: any) => (
          <Card key={o.id}>
            <CardHeader title={`Order ${o.id}`} subheader={`${o.items?.length ?? 0} item(s)`} action={<Chip label={o.status} color={o.status === "paid" ? "success" : o.status === "fulfilled" ? "primary" : "default"} />} />
            <CardContent>
              {o.items?.map((it: any) => (
                <Box key={it.id} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
                  <Typography variant="body2">{it.productVariant?.product?.title} — {it.productVariant?.size} — ${((it.unitPrice ?? 0)/100).toFixed(2)} × {it.qty}</Typography>
                  {it.productVariant?.product?.design?.title && <Chip size="small" label={it.productVariant.product.design.title} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}


