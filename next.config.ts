import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Mongoose/AWS não entram no bundle server — menos pressão no build */
  serverExternalPackages: [
    "mongoose",
    "mongodb",
    "@aws-sdk/client-s3",
  ],
  typescript: {
    tsconfigPath: "./tsconfig.build.json",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
