"use client";
import { Box, Button, Card, CardContent, CardHeader, Container, Stack, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function DesignPage() {
  const session = useSession();
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [artNaturalW, setArtNaturalW] = useState<number>(0);
  const [artNaturalH, setArtNaturalH] = useState<number>(0);

  // placement (normalized 0..1 relative to stage)
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.38);
  const [scale, setScale] = useState(0.5);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isDragging, setDragging] = useState(false);

  // Stage and art base sizes (px)
  const STAGE_W = 420;
  const STAGE_H = 540;
  const ART_BASE_W = 280; // image css width before scaling

  // Bounding box (normalized within stage)
  const bbox = useMemo(() => ({ x: 0.24, y: 0.20, w: 0.52, h: 0.60 }), []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFileUrl(url);
    setFileObj(f);
    const img = new Image();
    img.onload = () => {
      setArtNaturalW(img.naturalWidth || 1);
      setArtNaturalH(img.naturalHeight || 1);
    };
    img.src = url;
  };

  const clampXY = (nx: number, ny: number, s: number) => {
    const aspect = artNaturalH && artNaturalW ? artNaturalH / artNaturalW : 1;
    const halfWRel = (ART_BASE_W * s) / (STAGE_W * 2);
    const halfHRel = (ART_BASE_W * aspect * s) / (STAGE_H * 2);
    const minX = bbox.x + halfWRel;
    const maxX = bbox.x + bbox.w - halfWRel;
    const minY = bbox.y + halfHRel;
    const maxY = bbox.y + bbox.h - halfHRel;
    return {
      x: Math.min(maxX, Math.max(minX, nx)),
      y: Math.min(maxY, Math.max(minY, ny)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const c = clampXY(nx, ny, scale);
    setX(c.x);
    setY(c.y);
  };
  const onPointerUp = () => setDragging(false);
  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.04 : -0.04;
    setScale((prev) => {
      const next = Math.min(1.6, Math.max(0.2, prev + delta));
      const c = clampXY(x, y, next);
      setX(c.x);
      setY(c.y);
      return next;
    });
  };

  const submit = async () => {
    if (!fileObj) return;
    const fd = new FormData();
    fd.append("title", "User Submitted Tee");
    fd.append("placement", JSON.stringify({ x, y, scale, bbox }));
    fd.append("file", fileObj);
    const res = await fetch("/api/designs/upload", { method: "POST", body: fd });
    if (res.ok) alert("Submitted for review"); else alert("Submit failed");
  };

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardHeader title="Design a Tee" subheader="Upload art, drag to place, then submit for review" />
        <CardContent>
          {session.status !== "authenticated" ? (
            <Stack spacing={2}>
              <Typography variant="body2">Please sign in to submit a T‑Shirt.</Typography>
              <Button href="/login" variant="contained">Sign in</Button>
            </Stack>
          ) : (
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component="label" variant="outlined">Upload Artwork<input type="file" accept="image/*" hidden onChange={onFile} /></Button>
            </Stack>

            <Typography variant="subtitle2">Preview</Typography>
            <Box ref={stageRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}
              sx={{ width: STAGE_W, height: STAGE_H, mx: "auto", position: "relative", background: "#0b0c10", borderRadius: 2, overflow: "hidden", touchAction: "none" }}>
              {/* Tee color is black, mask silhouette */}
              <Box sx={{ position: "absolute", inset: 0, bgcolor: "#000", WebkitMask: 'url(/blackT.svg) center / contain no-repeat', mask: 'url(/blackT.svg) center / contain no-repeat' }} />
              {/* Tee outline */}
              <Box component="img" src="/blackT.svg" alt="tee" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
              {/* Bounding box */}
              <Box sx={{ position: "absolute", left: `${bbox.x * 100}%`, top: `${bbox.y * 100}%`, width: `${bbox.w * 100}%`, height: `${bbox.h * 100}%`, border: "1px dashed rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              {/* Artwork */}
              {fileUrl && (
                <Box component="img" src={fileUrl} alt="art" onPointerDown={onPointerDown} sx={{
                  position: "absolute",
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: `translate(-50%,-50%) scale(${scale})`,
                  width: ART_BASE_W,
                  pointerEvents: "auto",
                  cursor: isDragging ? "grabbing" : "grab",
                }} />
              )}
            </Box>

            <Button variant="contained" onClick={submit} disabled={!fileUrl}>Submit TShirt</Button>
          </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

 
