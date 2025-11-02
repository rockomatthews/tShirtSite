"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, MenuItem, Select, Stack, Typography, Tooltip } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [teeColor, setTeeColor] = useState<string>("#1f2937");

  const stageRef = useRef<HTMLDivElement>(null);

  // Heuristic color name mapping (extendable) for matching Printify variant names
  const COLOR_NAME_TO_HEX: Record<string, string> = {
    black: "#111111",
    white: "#FFFFFF",
    navy: "#1f2430",
    blue: "#2563eb",
    red: "#dc2626",
    maroon: "#6b0f1a",
    green: "#16a34a",
    forest: "#14532d",
    purple: "#7c3aed",
    pink: "#ec4899",
    orange: "#f97316",
    yellow: "#E6FB04",
    brown: "#7c4a2d",
    charcoal: "#374151",
    gray: "#6b7280",
    "heather grey": "#9ca3af",
    sand: "#e5e7eb",
    natural: "#ede9d5",
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "");
  const getVariantColorName = (v: any): string | null => {
    const fromOpt = v?.options?.color || v?.options?.colors?.[0];
    const title = String(v?.title ?? v?.name ?? "");
    const pool = [String(fromOpt ?? ""), title];
    for (const name of Object.keys(COLOR_NAME_TO_HEX)) {
      const n = normalize(name);
      if (pool.some((p) => normalize(p).includes(n))) return name;
    }
    return null;
  };

  // Group variants by color name
  const SIZE_ORDER = ["XS","S","M","L","XL","2XL","3XL","4XL","5XL"];
  const getVariantSize = (v: any): string | null => {
    const fromOpt = v?.options?.size ?? v?.options?.sizes?.[0];
    if (fromOpt) return String(fromOpt).toUpperCase();
    const title = String(v?.title ?? v?.name ?? "").toUpperCase();
    for (const s of SIZE_ORDER) if (title.includes(s)) return s;
    return null;
  };

  const colorGroups = useMemo(() => {
    const map = new Map<string, { hex: string; ids: number[]; sizes: Record<string, number> }>();
    for (const v of variants) {
      const colorName = getVariantColorName(v);
      if (!colorName) continue;
      const hex = COLOR_NAME_TO_HEX[colorName] ?? "#1f2937";
      const entry = map.get(colorName) ?? { hex, ids: [], sizes: {} };
      const idNum = Number(v.id);
      entry.ids.push(idNum);
      const size = getVariantSize(v);
      if (size) entry.sizes[size] = idNum;
      map.set(colorName, entry);
    }
    return map;
  }, [variants]);

  // When teeColor changes, auto-pick a color group whose hex matches
  useEffect(() => {
    // find closest by hex equality first
    for (const [name, entry] of colorGroups.entries()) {
      if (entry.hex.toLowerCase() === teeColor.toLowerCase()) {
        setVariantIds(entry.ids);
        return;
      }
    }
  }, [teeColor, colorGroups]);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

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
              <Button component="label" variant="outlined">
                Tee Color
                <input hidden type="color" value={teeColor} onChange={(e) => setTeeColor(e.target.value)} />
              </Button>
            </Stack>

            <Typography variant="subtitle2">Preview</Typography>
            <Box ref={stageRef} sx={{ width: 360, height: 450, mx: "auto", position: "relative", background: "#0b0c10", borderRadius: 2, overflow: "hidden" }}>
              {/* Tee colored shape via mask */}
              <Box sx={{ position: "absolute", inset: 0, bgcolor: teeColor, WebkitMask: 'url(/tshirt.svg) center / contain no-repeat', mask: 'url(/tshirt.svg) center / contain no-repeat' }} />
              {/* Tee outline on top */}
              <Box component="img" src="/tshirt.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
              {/* artwork */}
              {fileUrl && (
                <Box component="img" src={fileUrl} alt="art" sx={{
                  position: "absolute",
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: `translate(-50%,-50%) scale(${scale})`,
                  width: 260,
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
                {[...colorGroups.entries()].map(([name, entry]) => (
                  <Tooltip key={name} title={name}>
                    <Button
                      size="small"
                      variant={entry.ids.every((id) => variantIds.includes(id)) ? "contained" : "outlined"}
                      onClick={() => {
                        setVariantIds(entry.ids);
                        setTeeColor(entry.hex);
                        setSelectedColor(name);
                        const sorted = SIZE_ORDER.filter((s) => entry.sizes[s]);
                        setSelectedSizes(sorted);
                      }}
                      sx={{
                        minWidth: 28,
                        width: 28,
                        height: 28,
                        p: 0,
                        borderColor: entry.hex,
                        backgroundColor: entry.hex,
                        color: "#000",
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            {selectedColor && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Sizes – {selectedColor}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {SIZE_ORDER.filter((s) => colorGroups.get(selectedColor!)?.sizes[s]).map((s) => {
                    const id = colorGroups.get(selectedColor!)!.sizes[s];
                    const active = variantIds.includes(id);
                    return (
                      <Button
                        key={s}
                        size="small"
                        variant={active ? "contained" : "outlined"}
                        onClick={() => {
                          setVariantIds((prev) => active ? prev.filter((x) => x !== id) : [...prev, id]);
                          setSelectedSizes((prev) => active ? prev.filter((x) => x !== s) : [...prev, s]);
                        }}
                      >{s}</Button>
                    );
                  })}
                </Stack>
              </Box>
            )}
            <Button variant="contained" onClick={onCreate} disabled={!fileUrl || !blueprintId || !providerId || variantIds.length === 0}>Save Product</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}


