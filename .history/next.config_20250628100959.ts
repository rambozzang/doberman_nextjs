import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 성능 최적화 설정
  experimental: {
    // 더 빠른 빌드와 런타임 성능
    turbo: {
      loaders: {},
    },
    // 메모리 사용량 최적화
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // 컴파일 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 정적 최적화
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 이미지 최적화 설정
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // 헤더 최적화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
  
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
