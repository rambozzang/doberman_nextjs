import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '도배르만 - 전국 도배 전문가 비교견적 플랫폼',
    short_name: '도배르만',
    description: '전국 200명 이상의 검증된 도배 전문가들과 함께하는 스마트한 비교견적 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'ko',
    orientation: 'portrait-primary',
  }
} 