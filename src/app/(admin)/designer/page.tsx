"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function DesignerPage() {
  const { data: bp } = useSWR("/api/printify/blueprints", fetcher);
  const [blueprintId, setBlueprintId] = useState<string>("");
  const { data: providers } = useSWR(() => blueprintId ? `/api/printify/blueprints/${blueprintId}/providers` : null, fetcher);
  const [providerId, setProviderId] = useState<string>("");
  const { data: variantsData } = useSWR(() => (blueprintId && providerId ? `/api/printify/blueprints/${blueprintId}/providers/${providerId}/variants` : null), fetcher);
  const variants: any[] = variantsData?.variants ?? variantsData?.data ?? [];
  const [variantIds, setVariantIds] = useState<number[]>([]);

  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.35);
  const [scale, setScale] = useState(0.5);

  const stageRef = useRef<HTMLDivElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFileUrl(url);
    setFileObj(f);
  };

  const onCreate = async () => {
    if (!fileObj) return;
    const fd = new FormData();
    fd.append("title", "Custom Tee");
    fd.append("blueprintId", String(blueprintId));
    fd.append("providerId", String(providerId));
    fd.append("placement", JSON.stringify({ x, y, scale }));
    fd.append("variantIds", JSON.stringify(variantIds));
    fd.append("file", fileObj);
    const res = await fetch("/api/admin/printify/create-product", { method: "POST", body: fd });
    const out = await res.json();
    if (res.ok) alert(`Product created in Printify`);
    else alert(out?.message ?? "Failed");
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardHeader title="Design a Tee" subheader="Upload art and position on a tee mockup" />
        <CardContent>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Select value={blueprintId} displayEmpty onChange={(e) => setBlueprintId(String(e.target.value))} sx={{ minWidth: 260 }}>
                <MenuItem value="">Blueprint</MenuItem>
                {(bp?.data ?? []).map((b: any) => (<MenuItem key={b.id} value={String(b.id)}>{b.attributes?.title ?? b.title}</MenuItem>))}
              </Select>
              <Select value={providerId} displayEmpty onChange={(e) => setProviderId(String(e.target.value))} sx={{ minWidth: 260 }} disabled={!blueprintId}>
                <MenuItem value="">Provider</MenuItem>
                {(providers?.data ?? []).map((p: any) => (<MenuItem key={p.id} value={String(p.id)}>{p.attributes?.title ?? p.title}</MenuItem>))}
              </Select>
              <Button component="label" variant="outlined">Upload Artwork<input type="file" accept="image/*" hidden onChange={onFile} /></Button>
            </Stack>

            <Typography variant="subtitle2">Preview</Typography>
            <Box ref={stageRef} sx={{ width: 320, height: 420, mx: "auto", position: "relative", background: "#1f2937", borderRadius: 2, overflow: "hidden" }}>
              {/* tee silhouette */}
              <Box sx={{ position: "absolute", inset: 0, opacity: 0.25, background: "linear-gradient(180deg,#000 0,#111 100%)" }} />
              {/* artwork */}
              {fileUrl && (
                <Box component="img" src={fileUrl} alt="art" sx={{
                  position: "absolute",
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: `translate(-50%,-50%) scale(${scale})`,
                  width: 240,
                  pointerEvents: "none",
                }} />
              )}
            </Box>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => setScale((s) => Math.min(1.5, s + 0.05))}>Zoom +</Button>
              <Button variant="contained" onClick={() => setScale((s) => Math.max(0.2, s - 0.05))}>Zoom -</Button>
              <Button variant="outlined" onClick={() => setY((v) => Math.max(0.2, v - 0.02))}>Up</Button>
              <Button variant="outlined" onClick={() => setY((v) => Math.min(0.8, v + 0.02))}>Down</Button>
            </Stack>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Variants</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {variants.map((v: any) => (
                  <Button key={v.id} size="small" variant={variantIds.includes(v.id) ? "contained" : "outlined"} onClick={() => setVariantIds((prev) => prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id])}>
                    {v.title ?? v.name ?? v.id}
                  </Button>
                ))}
              </Stack>
            </Box>
            <Button variant="contained" onClick={onCreate} disabled={!fileUrl || !blueprintId || !providerId || variantIds.length === 0}>Save Product</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}


