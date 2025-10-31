"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { Box, Button, Container, Divider, Grid, MenuItem, Select, Stack, TextField, Typography, Chip } from "@mui/material";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewProductPage() {
  const { data: bpData } = useSWR("/api/printify/blueprints", fetcher);
  const blueprints: any[] = bpData?.data ?? [];
  const [blueprintId, setBlueprintId] = useState<string>("");
  const { data: providersData } = useSWR(() => (blueprintId ? `/api/printify/blueprints/${blueprintId}/providers` : null), fetcher);
  const providers: any[] = providersData?.data ?? [];
  const [providerId, setProviderId] = useState<string>("");
  const { data: variantsData } = useSWR(() => (blueprintId && providerId ? `/api/printify/blueprints/${blueprintId}/providers/${providerId}/variants` : null), fetcher);
  const variants: any[] = variantsData?.variants ?? variantsData?.data ?? [];

  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [markupPct, setMarkupPct] = useState<number>(50);
  const [maxPhysical, setMaxPhysical] = useState<number>(100);
  const [maxVirtual, setMaxVirtual] = useState<number>(100);

  const onCreate = async () => {
    const res = await fetch("/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        markupPct,
        blueprintId: Number(blueprintId),
        providerId: String(providerId),
        variantIds: selectedVariantIds,
        maxSupplyPhysical: maxPhysical,
        maxSupplyVirtual: maxVirtual,
      }),
    });
    if (res.ok) {
      window.location.href = "/products";
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        New Product (Printify)
      </Typography>

      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ minWidth: 360 }} />
          <TextField label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} sx={{ minWidth: 240 }} />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box>
            <Typography variant="subtitle2">Blueprint</Typography>
            <Select value={blueprintId} onChange={(e) => { setBlueprintId(String(e.target.value)); setProviderId(""); setSelectedVariantIds([]); }} displayEmpty sx={{ minWidth: 320 }}>
              <MenuItem value="">Select</MenuItem>
              {blueprints.map((bp) => (
                <MenuItem key={bp.id} value={String(bp.id)}>{bp.attributes?.title ?? bp.title ?? bp.id}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="subtitle2">Provider</Typography>
            <Select value={providerId} onChange={(e) => { setProviderId(String(e.target.value)); setSelectedVariantIds([]); }} displayEmpty sx={{ minWidth: 320 }} disabled={!blueprintId}>
              <MenuItem value="">Select</MenuItem>
              {providers.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.attributes?.title ?? p.title ?? p.id}</MenuItem>
              ))}
            </Select>
          </Box>
        </Stack>

        <Box>
          <Typography variant="subtitle2" gutterBottom>Variants</Typography>
          <Grid container spacing={1}>
            {variants.map((v: any) => (
              <Grid key={v.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Chip
                  label={v.title ?? v.name ?? v.id}
                  color={selectedVariantIds.includes(v.id) ? "success" : "default"}
                  onClick={() => {
                    setSelectedVariantIds((prev) => prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id]);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField type="number" label="Markup %" value={markupPct} onChange={(e) => setMarkupPct(Number(e.target.value))} sx={{ maxWidth: 180 }} />
          <TextField type="number" label="Max Supply (Physical)" value={maxPhysical} onChange={(e) => setMaxPhysical(Number(e.target.value))} sx={{ maxWidth: 220 }} />
          <TextField type="number" label="Max Supply (Virtual)" value={maxVirtual} onChange={(e) => setMaxVirtual(Number(e.target.value))} sx={{ maxWidth: 220 }} />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" disabled={!title || !slug || !blueprintId || !providerId || selectedVariantIds.length === 0} onClick={onCreate}>Create Product</Button>
        </Stack>
      </Stack>
    </Container>
  );
}


