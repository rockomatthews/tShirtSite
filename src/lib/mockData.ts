import type { Product } from "@/types";

export const featuredProduct: Product = {
  id: "p_feat",
  slug: "galaxy-waves",
  title: "Galaxy Waves Tee",
  description: "Vibrant cosmic gradient with fluid waves. Premium cotton.",
  imageUrl: "/window.svg",
  price: 29.0,
  creatorHandle: "@astroart",
  approved: true,
};

export const approvedProducts: Product[] = [
  {
    id: "p_1",
    slug: "neon-samurai",
    title: "Neon Samurai",
    description: "Cyberpunk line art",
    imageUrl: "/globe.svg",
    price: 28,
    creatorHandle: "@vectorgeist",
    approved: true,
  },
  {
    id: "p_2",
    slug: "mono-rose",
    title: "Monochrome Rose",
    description: "Bold floral",
    imageUrl: "/file.svg",
    price: 26,
    creatorHandle: "@inkblot",
    approved: true,
  },
  {
    id: "p_3",
    slug: "pixel-cat",
    title: "Pixel Cat",
    description: "Retro 8-bit",
    imageUrl: "/next.svg",
    price: 24,
    creatorHandle: "@retrobyte",
    approved: true,
  },
  {
    id: "p_4",
    slug: "sunset-layers",
    title: "Sunset Layers",
    description: "Minimal sunset",
    imageUrl: "/vercel.svg",
    price: 27,
    creatorHandle: "@minimalist",
    approved: true,
  },
];


