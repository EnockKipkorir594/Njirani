
import path from "node:path";
import type { NextConfig } from "next";

const backendUrl = (
  process.env.NJIRANI_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {

  allowedDevOrigins: ["192.168.1.9"],
  turbopack: {
    root: path.resolve(__dirname),
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;


