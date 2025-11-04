"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";

export default function NewProductPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [markupPct, setMarkupPct] = useState<number>(50);
  const [maxPhysical, setMaxPhysical] = useState<number>(100);
  const [maxVirtual, setMaxVirtual] = useState<number>(100);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileObj, setFileObj] = useState<File | null>(null);

  const SIZES = ["S","M","L","XL","2XL","3XL"];
  const [sizes, setSizes] = useState<string[]>(["M","L","XL"]);

  // placement (normalized)
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.38);
  const [scale, setScale] = useState(0.5);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDragging, setDragging] = useState(false);

  const STAGE_W = 420;
  const STAGE_H = 540;
  const ART_BASE_W = 280;
  const bbox = useMemo(() => ({ x: 0.24, y: 0.20, w: 0.52, h: 0.60 }), []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFileUrl(url);
    setFileObj(f);
  };
  const clampXY = (nx: number, ny: number, s: number) => {
    const halfWRel = (ART_BASE_W * s) / (STAGE_W * 2);
    const halfHRel = (ART_BASE_W * s) / (STAGE_H * 2);
    const minX = bbox.x + halfWRel;
    const maxX = bbox.x + bbox.w - halfWRel;
    const minY = bbox.y + halfHRel;
    const maxY = bbox.y + bbox.h - halfHRel;
    return { x: Math.min(maxX, Math.max(minX, nx)), y: Math.min(maxY, Math.max(minY, ny)) };
  };
  const onPointerDown = (e: React.PointerEvent) => { setDragging(true); (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const c = clampXY(nx, ny, scale);
    setX(c.x); setY(c.y);
  };
  const onPointerUp = () => setDragging(false);
  const onWheel = (e: React.WheelEvent) => { const d = e.deltaY < 0 ? 0.04 : -0.04; setScale((s) => Math.min(1.6, Math.max(0.2, s + d))); };

  const submit = async () => {
    if (!fileObj || !title || sizes.length === 0) return;
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("markupPct", String(markupPct));
    fd.append("maxSupplyPhysical", String(maxPhysical));
    fd.append("maxSupplyVirtual", String(maxVirtual));
    fd.append("sizes", JSON.stringify(sizes));
    fd.append("placement", JSON.stringify({ x, y, scale, bbox }));
    fd.append("file", fileObj);
    const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
    if (res.ok) window.location.href = "/shop"; else alert("Create failed");
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardHeader title="Create T‑Shirt" subheader="Upload art, place it, set sizes and submit" />
        <CardContent>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ minWidth: 300 }} />
              <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ minWidth: 300 }} />
              <TextField type="number" label="Markup %" value={markupPct} onChange={(e) => setMarkupPct(Number(e.target.value))} sx={{ maxWidth: 160 }} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField type="number" label="Max Supply (Physical)" value={maxPhysical} onChange={(e) => setMaxPhysical(Number(e.target.value))} sx={{ maxWidth: 220 }} />
              <TextField type="number" label="Max Supply (Virtual)" value={maxVirtual} onChange={(e) => setMaxVirtual(Number(e.target.value))} sx={{ maxWidth: 220 }} />
              <Button component="label" variant="outlined">Upload Artwork<input type="file" accept="image/*" hidden onChange={onFile} /></Button>
            </Stack>

            <Typography variant="subtitle2">Preview</Typography>
            <Box ref={stageRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}
              sx={{ width: STAGE_W, height: STAGE_H, mx: "auto", position: "relative", background: "#0b0c10", borderRadius: 2, overflow: "hidden", touchAction: "none" }}>
              <Box sx={{ position: "absolute", inset: 0, bgcolor: "#000", WebkitMask: 'url(/blackT.svg) center / contain no-repeat', mask: 'url(/blackT.svg) center / contain no-repeat' }} />
              <Box component="img" src="/blackT.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
              <Box sx={{ position: "absolute", left: `${bbox.x * 100}%`, top: `${bbox.y * 100}%`, width: `${bbox.w * 100}%`, height: `${bbox.h * 100}%`, border: "1px dashed rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              {fileUrl && (
                <Box component="img" src={fileUrl} alt="art" onPointerDown={onPointerDown} sx={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%,-50%) scale(${scale})`, width: ART_BASE_W, pointerEvents: "auto", cursor: isDragging ? "grabbing" : "grab" }} />
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Sizes</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {SIZES.map((s) => (
                  <Button key={s} size="small" variant={sizes.includes(s) ? "contained" : "outlined"} onClick={() => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}>{s}</Button>
                ))}
              </Stack>
            </Box>

            <Button variant="contained" onClick={submit} disabled={!fileUrl || !title || sizes.length === 0}>Submit TShirt</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}


