import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Limit webpack build workers to 1 (default = cores, i.e. 4 on this box).
    // Each worker is a full Node process with its own ~2GB heap — fewer
    // workers = far lower peak build memory on this 7.6GB RAM server.
    cpus: 1,
  },
};

export default nextConfig;
