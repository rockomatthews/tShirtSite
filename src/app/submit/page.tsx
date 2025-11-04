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
        // Stream original to Blob via server route
        const uploadRes = await fetch(`/api/uploads/blob?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          headers: { "content-type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!uploadRes.ok) { setBusy(false); return; }
        const { url } = await uploadRes.json();
        const fd = new FormData();
        fd.append("title", title);
        fd.append("description", desc);
        fd.append("fileUrl", url);
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


