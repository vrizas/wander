import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

loadEnvConfig(`${process.cwd()}/../..`, process.env.NODE_ENV !== "production", console, true);

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY ?? "" },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
