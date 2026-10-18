import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker build sets NEXT_OUTPUT=standalone (`node server.js`, a small image);
  // a plain `npm run build && npm start` works without it.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  // Covers and logos come from the file storage (STORAGE_PUBLIC_URL) as ready
  // WebP sizes, so plain <img> is used and the image optimizer is not needed.
  images: { unoptimized: true },
};

export default nextConfig;
