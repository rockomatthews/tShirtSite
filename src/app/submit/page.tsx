"use client";
import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function SubmitDesignPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Submit a Design
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        If approved, your tee will be listed. Creators earn 50% of store margin per sale.
      </Typography>
      <Stack spacing={2} component="form" onSubmit={(e) => e.preventDefault()}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} multiline minRows={3} />
        <Button variant="outlined" component="label">
          Upload Artwork (PNG/TIFF)
          <input hidden type="file" accept="image/png,image/tiff" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Button>
        {file && <Box color="text.secondary">Selected: {file.name}</Box>}
        <Stack direction="row" gap={2}>
          <Button type="submit" variant="contained">Submit for Review</Button>
          <Button href="/u/%40you" variant="text">Preview Profile</Button>
        </Stack>
      </Stack>
    </Container>
  );
}


