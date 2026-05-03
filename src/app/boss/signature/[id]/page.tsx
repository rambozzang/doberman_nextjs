'use client';

// 사장님 고객 서명 상세 페이지
// Flutter: lib/app/signature/signature_detail_page.dart 와 대응
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  CheckCircle2,
  Phone,
  FileText,
  Hash,
  PenLine,
} from 'lucide-react';
import { bossSignatureApi } from '@/lib/api/boss/signature';
import { BossAuthManager } from '@/lib/bossAuth';
import type { BossSignatureItem } from '@/types/boss-signature';

// 날짜 포맷터(년 월 일)
function formatLongDate(input?: string | null): string {
  if (!input) return '미확인';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '미확인';
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(
    d.getDate(),
  ).padStart(2, '0')}일`;
}

// 휴대폰 포맷터
function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function BossSignatureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [item, setItem] = useState<BossSignatureItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 단일 조회 API 가 없으므로 사용자별 목록에서 찾음 (Flutter 와 동일 패턴)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userInfo = BossAuthManager.getUserInfo();
      const custId = userInfo?.userId ?? '';
      if (!custId) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      try {
        const res = await bossSignatureApi.list(custId);
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          const found = res.data.find((it) => String(it.id) === String(id)) ?? null;
          setItem(found);
          if (!found) setError('정보를 찾을 수 없습니다.');
        } else {
          setError(res.message || '서명 정보를 불러오지 못했습니다.');
        }
      } catch {
        if (!cancelled) setError('네트워크 오류로 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!item?.id) return;
    if (!confirm('이 고객 서명 기록을 영구적으로 삭제하시겠습니까?')) return;
    const userInfo = BossAuthManager.getUserInfo();
    const custId = userInfo?.userId ?? '';
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossSignatureApi.remove(item.id, custId);
      if (res.success) {
        toast.success('삭제되었습니다.');
        router.push('/boss/signature');
      } else {
        toast.error(res.message || '오류가 발생했습니다.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href="/boss/signature"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} /> 목록으로
        </Link>
        {item && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-700/50 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/40 disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? '삭제 중…' : '삭제'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      ) : error || !item ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
          {error ?? '정보를 찾을 수 없습니다.'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* 서명 이미지 (Hero) */}
          <div className="flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-white p-6">
            {item.signatureImagePath && (item.signatureImagePath.startsWith('http') || item.signatureImagePath.startsWith('data:')) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.signatureImagePath}
                alt={item.customerName ?? 'signature'}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <PenLine size={80} className="text-slate-300" />
            )}
          </div>

          {/* 정보 카드 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-rose-300">{item.customerName ?? '이름 없음'}</h2>
              {item.orderId ? (
                <Link
                  href={`/boss/orders`}
                  className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-400"
                >
                  주문 이동
                </Link>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              <InfoRow icon={<Calendar size={14} />} label="등록일" value={formatLongDate(item.createdDt)} />
              <InfoRow
                icon={<CheckCircle2 size={14} />}
                label="확인일"
                value={formatLongDate(item.confirmedAt)}
              />
              {item.customerPhone ? (
                <InfoRow icon={<Phone size={14} />} label="연락처" value={formatPhone(item.customerPhone)} />
              ) : null}
              {item.recordId ? (
                <InfoRow icon={<FileText size={14} />} label="시공기록" value={`#${item.recordId}`} />
              ) : null}
              {item.orderId ? (
                <InfoRow icon={<Hash size={14} />} label="주문" value={`#${item.orderId}`} />
              ) : null}
            </dl>

            {item.memo ? (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">메모</p>
                <p className="text-sm leading-relaxed text-slate-300">{item.memo}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-rose-300">
        {icon}
      </span>
      <span className="w-16 text-xs text-slate-500">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
