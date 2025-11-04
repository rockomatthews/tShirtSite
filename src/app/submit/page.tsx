"use client";
import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function SubmitDesignPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Design</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        If approved, your tee will be listed. Creators earn 50% of store margin per sale.
      </Typography>
      <Stack spacing={2} component="form" onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        setBusy(true);
        // compress client-side to avoid serverless body limits
        const compress = async (f: File) => {
          try {
            const bmp = await createImageBitmap(f);
            const maxW = 1600;
            const scale = Math.min(1, maxW / bmp.width);
            const w = Math.round(bmp.width * scale);
            const h = Math.round(bmp.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return f;
            ctx.drawImage(bmp, 0, 0, w, h);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
            if (!blob) return f;
            return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
          } catch { return f; }
        };
        const small = await compress(file);
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", desc);
        fd.append("file", small);
        const res = await fetch("/api/designs/upload", { method: "POST", body: fd });
        const out = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) setDone(out.id ?? "ok");
      }}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} multiline minRows={3} />
        <Button variant="outlined" component="label">
          Upload Artwork (PNG/JPG/WEBP)
          <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Button>
        {file && <Box color="text.secondary">Selected: {file.name}</Box>}
        <Stack direction="row" gap={2}>
          <Button type="submit" variant="contained" disabled={!file || busy}>{busy ? "Uploading..." : "Submit for Review"}</Button>
          <Button href="/u/%40you" variant="text">Preview Profile</Button>
        </Stack>
        {done && <Typography color="success.main">Uploaded! Design id: {done}</Typography>}
      </Stack>
    </Container>
  );
}


