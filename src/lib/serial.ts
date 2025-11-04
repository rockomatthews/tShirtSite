import sharp from "sharp";

export async function composeSerialPng(baseImage: Buffer, serial: string): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .serial { fill: #E6FB04; font-size: 88px; font-family: Arial, Helvetica, sans-serif; font-weight: 800; }
      </style>
      <rect x="0" y="0" width="1200" height="1200" fill="transparent" />
      <text x="50%" y="92%" text-anchor="middle" class="serial">#${serial}</text>
    </svg>`
  );

  return await sharp(baseImage)
    .resize({ width: 1200, height: 1200, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

export async function renderSerialOverlayPng(serial: string): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .serial { fill: #E6FB04; font-size: 88px; font-family: Arial, Helvetica, sans-serif; font-weight: 800; }
      </style>
      <rect x="0" y="0" width="1200" height="1200" fill="transparent" />
      <text x="50%" y="12%" text-anchor="middle" class="serial">#${serial}</text>
    </svg>`
  );
  return await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();
}


