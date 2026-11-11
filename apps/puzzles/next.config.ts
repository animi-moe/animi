import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(configDir, "../..") },

  ...(process.env.CF_PAGES
    ? { output: "export" as const, images: { unoptimized: true } }
    : { output: "standalone" as const, allowedDevOrigins: ["192.168.68.66"] }),
};

export default nextConfig;
