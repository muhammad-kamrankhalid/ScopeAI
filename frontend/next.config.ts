import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't try to statically pre-render pages that use runtime env vars
  // (Supabase client needs NEXT_PUBLIC_* at runtime, not build time)
  output: "standalone",
};

export default nextConfig;
