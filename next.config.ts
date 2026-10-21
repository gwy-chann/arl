import path from "path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(__dirname).includes(".worktrees")
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
