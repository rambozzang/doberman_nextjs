'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { bossRequestsApi } from '@/lib/api/boss/requests';
import type { BossRequestDetail } from '@/types/boss';
import BossPageHeader from '@/components/boss/BossPageHeader';

export default function BossRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [data, setData] = useState<BossRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await bossRequestsApi.detail(id);
        if (cancelled) return;
        if (res.success && res.data) setData(res.data);
        else setError(res.message || '상세를 불러오지 못했습니다.');
      } catch {
        if (!cancelled) setError('네트워크 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="space-y-4">
      <BossPageHeader
        title={`견적 요청 #${id}`}
        backHref="/boss/requests"
        actions={
          <Link
            href={`/boss/requests/${id}/answer`}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            답변 작성
          </Link>
        }
      />
      {error && <div className="rounded border border-rose-700 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>}
      {loading ? (
        <div className="rounded border border-slate-700 bg-slate-800/40 p-6 text-center text-sm text-slate-400">불러오는 중...</div>
      ) : data ? (
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/60 p-5">
          <Field label="건물 유형" value={data.buildingType} />
          <Field label="지역" value={data.region} />
          <Field label="시공 위치" value={data.constructionLocation} />
          <Field label="면적" value={data.areaSize ? `${data.areaSize}㎡` : undefined} />
          <Field label="방 개수" value={data.roomCount?.toString()} />
          <Field label="벽지" value={data.wallpaper} />
          <Field label="천장" value={data.ceiling} />
          <Field label="희망 일정" value={data.preferredDate} />
          <Field label="요청사항" value={data.specialInfoDetail || data.specialInfo} />
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}
