import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cetusprotocol/cetus-sui-clmm-sdk"],
  webpack: (config, { isServer }) => {
    // handle webAssembly
    config.experiments = { asyncWebAssembly: true, syncWebAssembly: true, layers: true};
    return config;
  },
};

export default nextConfig;
