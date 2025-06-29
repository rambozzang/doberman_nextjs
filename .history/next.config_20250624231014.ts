import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/chat/:path*',
        destination: 'https://www.tigerbk.com/chat-api/:path*',
      },
    ];
  },
};

export default nextConfig;
