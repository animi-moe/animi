import type { NextConfig } from "next";
import path from "path";

const isCloudflareBuild = !!process.env.CF_PAGES;

const nextConfig: NextConfig = isCloudflareBuild
  ? {
      turbopack: {
        root: path.resolve(__dirname, "../.."),
      },
    }
  : {
      output: "standalone",
      allowedDevOrigins: ["192.168.68.66"],
    };

export default nextConfig;
