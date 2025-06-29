import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://doberman.co.kr'
  
  // 기본 페이지들
  const routes = [
    '',
    '/quote-request',
    '/quote-request/list',
    '/quote-request/my-quotes',
    '/board',
    '/board/write',
    '/service-intro',
    '/regional-guide',
    '/faq',
    '/checklist',
    '/customer-support',
  ]

  const staticPages = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 추후 동적 페이지들 추가 (게시글, 견적 등)
  // const dynamicPages = await getDynamicPages()

  return [
    ...staticPages,
    // ...dynamicPages,
  ]
} 