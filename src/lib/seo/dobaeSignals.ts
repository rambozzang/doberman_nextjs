export interface RegionalSignals {
  vendorCount: number | null;
  requestCount: number | null;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

interface VendorRegionResponse {
  total?: number;
}

interface RequestSearchResponse {
  totalCount?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.tigerbk.com/api-doman/web';

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.success === false ? null : payload.data ?? null;
  } catch {
    // SEO 페이지는 외부 통계 API 장애 때문에 500이 되면 안 된다.
    return null;
  }
}

export async function getRegionalSignals(sido: string, sigungu: string): Promise<RegionalSignals> {
  const [vendor, requests] = await Promise.all([
    postJson<VendorRegionResponse>('/vendor/by-region', { sido, sigungu, limit: 1 }),
    postJson<RequestSearchResponse>('/customer-request/search', {
      page: 0,
      size: 1,
      region: `${sido} ${sigungu}`,
      sortBy: 'latest',
      sortDirection: 'desc',
    }),
  ]);

  return {
    vendorCount: typeof vendor?.total === 'number' ? vendor.total : null,
    requestCount: typeof requests?.totalCount === 'number' ? requests.totalCount : null,
  };
}
