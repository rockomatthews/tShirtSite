"use client";
import useSWR from "swr";
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, TextField, Typography } from "@mui/material";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ReviewDesignsPage() {
  const { data, mutate } = useSWR("/api/admin/designs/list", fetcher);
  const pending = data?.designs ?? [];

  const approve = async (id: string, color: string, physical: number, virtual: number) => {
    await fetch(`/api/admin/designs/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color, maxSupplyPhysical: physical, maxSupplyVirtual: virtual }),
    });
    mutate();
  };
  const reject = async (id: string) => {
    await fetch(`/api/admin/designs/${id}/reject`, { method: "POST" });
    mutate();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Review Designs</Typography>
      <Stack spacing={2}>
        {pending.map((d: any) => (
          <Card key={d.id}>
            <CardHeader title={d.title} subheader={d.description} />
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Box component="img" src={d.previewKey?.startsWith("data:") ? d.previewKey : undefined} alt="preview" sx={{ width: 140, height: 140, objectFit: "cover", borderRadius: 1, bgcolor: "#111" }} />
                <TextField label="Mint (Physical)" type="number" defaultValue={100} id={`phys-${d.id}`} sx={{ maxWidth: 200 }} />
                <TextField label="Mint (Virtual)" type="number" defaultValue={100} id={`virt-${d.id}`} sx={{ maxWidth: 200 }} />
                <Button component="label" variant="outlined">Color<input hidden type="color" id={`color-${d.id}`} /></Button>
                <Button variant="contained" onClick={() => approve(
                  d.id,
                  (document.getElementById(`color-${d.id}`) as HTMLInputElement)?.value || "#111111",
                  Number((document.getElementById(`phys-${d.id}`) as HTMLInputElement)?.value || 100),
                  Number((document.getElementById(`virt-${d.id}`) as HTMLInputElement)?.value || 100),
                )}>Approve</Button>
                <Button variant="outlined" color="error" onClick={() => reject(d.id)}>Reject</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}


