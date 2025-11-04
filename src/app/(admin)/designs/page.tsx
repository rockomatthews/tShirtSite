"use client";
import useSWR from "swr";
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, TextField, Typography } from "@mui/material";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ReviewDesignsPage() {
  const { data, mutate } = useSWR("/api/admin/designs/list", fetcher);
  const pending = data?.designs ?? [];

  const approve = async (id: string, physical: number, virtual: number) => {
    await fetch(`/api/admin/designs/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxSupplyPhysical: physical, maxSupplyVirtual: virtual }),
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
        {pending.map((d: any) => {
          const placementTag = (d.tags ?? []).find((t: string) => t.startsWith("placement:"));
          const placement = placementTag ? (() => { try { return JSON.parse(placementTag.replace("placement:", "")); } catch { return null; } })() : null;
          const creatorName = d?.creator?.name || d?.creator?.email || "Unknown";
          return (
            <Card key={d.id}>
              <CardHeader title={d.title || "Untitled"} subheader={`${creatorName}${d.description ? " • " + d.description : ""}`} />
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                  <TeePreview artSrc={d.fileKey || d.previewKey} placement={placement} />
                  <TextField label="Mint (Physical)" type="number" defaultValue={100} id={`phys-${d.id}`} sx={{ maxWidth: 200 }} />
                  <TextField label="Mint (Virtual)" type="number" defaultValue={100} id={`virt-${d.id}`} sx={{ maxWidth: 200 }} />
                  <Button variant="contained" onClick={() => approve(
                    d.id,
                    Number((document.getElementById(`phys-${d.id}`) as HTMLInputElement)?.value || 100),
                    Number((document.getElementById(`virt-${d.id}`) as HTMLInputElement)?.value || 100),
                  )}>Approve</Button>
                  <Button variant="outlined" color="error" onClick={() => reject(d.id)}>Reject</Button>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
}


function TeePreview({ artSrc, placement }: { artSrc: string; placement: any }) {
  const STAGE_W = 260;
  const STAGE_H = 335;
  const ART_BASE_W = 180;
  const p = placement || { x: 0.5, y: 0.38, scale: 0.5, bbox: { x: 0.24, y: 0.20, w: 0.60, h: 0.60 } };
  return (
    <Box sx={{ width: STAGE_W, height: STAGE_H, position: "relative", background: "#0b0c10", borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, bgcolor: "#000", WebkitMask: 'url(/blackT.svg) center / contain no-repeat', mask: 'url(/blackT.svg) center / contain no-repeat' }} />
      <Box component="img" src="/blackT.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
      {p?.bbox && <Box sx={{ position: "absolute", left: `${p.bbox.x * 100}%`, top: `${p.bbox.y * 100}%`, width: `${p.bbox.w * 100}%`, height: `${p.bbox.h * 100}%`, border: "1px dashed rgba(255,255,255,0.3)", pointerEvents: "none" }} />}
      {artSrc && (
        <Box component="img" src={artSrc} alt="art" sx={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: `translate(-50%,-50%) scale(${p.scale ?? 0.5})`, width: ART_BASE_W }} />
      )}
    </Box>
  );
}

