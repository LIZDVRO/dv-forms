import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // The wizard's "Before you start" step is the front door; the old landing page is gone.
  async redirects() {
    return [{ source: "/", destination: "/wizard", permanent: false }];
  },
};

export default nextConfig;
