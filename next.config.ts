import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Turbopack workspace root 를 현재 프로젝트로 고정
  // (상위 디렉터리의 package-lock.json 을 잘못 잡는 경고 방지)
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // 메모리 사용량 최적화
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // 컴파일 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
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
  
  async redirects() {
    return [
      // 플랜에 정의된 일부 라우트를 실제 구현 위치로 연결
      { source: '/boss/home', destination: '/boss', permanent: false },
      { source: '/boss/photo/camera', destination: '/boss/photo', permanent: false },
      { source: '/boss/signatures', destination: '/boss/signature', permanent: false },
      { source: '/boss/signatures/capture', destination: '/boss/signature/capture', permanent: false },
      { source: '/boss/signatures/:id', destination: '/boss/signature/:id', permanent: false },
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
