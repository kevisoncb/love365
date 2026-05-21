import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "mongoose",
    "mongodb",
    "@aws-sdk/client-s3",
  ],
  typescript: {
    tsconfigPath: "./tsconfig.build.json",
  },
};

export default nextConfig;
