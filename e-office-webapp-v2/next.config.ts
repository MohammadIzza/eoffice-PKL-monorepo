import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    NEXT_PUBLIC_FE_URL: process.env.NEXT_PUBLIC_FE_URL || "http://localhost:3000",
  },
};

export default nextConfig;
