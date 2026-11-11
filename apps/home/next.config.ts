import type { NextConfig } from "next";

const isCloudflareBuild = !!process.env.CF_PAGES;

const nextConfig: NextConfig = isCloudflareBuild
  ? {
      turbopack: {
        root: __dirname,
      },
    }
  : {
      output: "standalone",
      allowedDevOrigins: ["192.168.68.66"],
    };

export default nextConfig;
