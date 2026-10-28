import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vybe/core"],
  turbopack: { root: path.resolve(process.cwd(), "../..") },
  poweredByHeader: false,
};

export default nextConfig;
