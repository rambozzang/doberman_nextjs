import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '도배르만 - 도배 견적 비교 플랫폼',
        short_name: '도배르만',
        description: '전국 300명+ 검증된 도배 전문가 무료 비교견적',
        start_url: '/',
        display: 'standalone',
        background_color: '#1e293b',
        theme_color: '#1e293b',
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
    }
}
