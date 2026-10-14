import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint runs as its own step (`npm run lint`, CI) with a flat config; skip Next's built-in pass.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
