'use client';

// AS 요청 상세 페이지
// Flutter: as_request_detail_page.dart 포팅
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Wrench,
  Phone,
  MapPin,
  User,
  Receipt,
  Loader2,
} from 'lucide-react';
import { bossAsApi, getBossCustId } from '@/lib/api/boss/as';
import type { AsRequestItem } from '@/types/boss-as';

type Tab = 'defect' | 'repair';

function formatDate(input?: string | null): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function statusColor(status: string): string {
  switch (status) {
    case '접수':
      return 'bg-boss-info/10 text-boss-info ring-boss-info/30';
    case '진행중':
      return 'bg-boss-warning/10 text-boss-warning ring-amber-500/30';
    case '완료':
      return 'bg-boss-primary/10 text-boss-primary ring-boss-primary/30';
    case '취소':
      return 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30';
    default:
      return 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30';
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case '긴급':
      return 'bg-boss-error/100/15 text-boss-error ring-boss-error/30';
    case '보통':
      return 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30';
    case '낮음':
      return 'bg-boss-elevated/30 text-boss-text-muted ring-boss-border/30';
    default:
      return 'bg-boss-elevated/40 text-boss-text-secondary ring-boss-border/30';
  }
}

function nextStatus(status: string): { next: string; label: string } | null {
  if (status === '접수') return { next: '진행중', label: '진행' };
  if (status === '진행중') return { next: '완료', label: '완료' };
  return null;
}

export default function BossAsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [item, setItem] = useState<AsRequestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('defect');
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bossAsApi.detail(id);
      if (res.success !== false && res.data) {
        setItem(res.data);
      } else {
        setError(res.message || '상세 정보를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 상세 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangeStatus = async (newStatus: string) => {
    if (!item) return;
    if (!confirm(`상태를 "${newStatus}"(으)로 변경하시겠습니까?`)) return;
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setStatusChanging(true);
    try {
      const res = await bossAsApi.changeStatus(item.id, custId, newStatus);
      if (res.success !== false) {
        toast.success(`상태가 "${newStatus}"(으)로 변경되었습니다`);
        await load();
      } else {
        toast.error(res.message || '상태 변경에 실패했습니다');
      }
    } catch {
      toast.error('상태 변경 중 오류가 발생했습니다');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm('이 AS 요청을 삭제하시겠습니까?\n삭제된 요청은 복구할 수 없습니다.')) return;
    const custId = getBossCustId();
    if (!custId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setDeleting(true);
    try {
      const res = await bossAsApi.remove(item.id, custId);
      if (res.success !== false) {
        toast.success('AS 요청이 삭제되었습니다');
        router.push('/boss/as');
      } else {
        toast.error(res.message || '삭제에 실패했습니다');
      }
    } catch {
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !item) {
    return (
      <div className="flex h-64 items-center justify-center text-boss-text-muted">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-3">
        <Link href="/boss/as" className="inline-flex items-center gap-1 text-sm text-boss-text-muted hover:text-boss-text">
          <ArrowLeft size={14} /> 목록으로
        </Link>
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-4 text-sm text-boss-error">
          {error || '데이터를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const defectImages = item.images?.filter((i) => i.imageType === 'DEFECT') ?? [];
  const repairImages = item.images?.filter((i) => i.imageType === 'REPAIR') ?? [];
  const next = nextStatus(item.status);
  const isClosed = item.status === '완료' || item.status === '취소';

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/boss/as"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-boss-border bg-boss-surface text-boss-text-secondary hover:text-boss-text"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-xl font-bold text-boss-text">AS 요청 내용</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && next && (
            <button
              type="button"
              onClick={() => handleChangeStatus(next.next)}
              disabled={statusChanging}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-primary/20 bg-boss-primary/10 px-3 text-xs font-bold text-boss-primary hover:border-emerald-400 hover:text-boss-text disabled:opacity-50"
            >
              {statusChanging ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {next.label}
            </button>
          )}
          <Link
            href={`/boss/as/new?id=${encodeURIComponent(item.id)}`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 text-xs font-bold text-indigo-200 hover:border-indigo-400 hover:text-boss-text"
          >
            <Pencil size={12} /> 수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-boss-error/30 bg-boss-error/10 px-3 text-xs font-bold text-boss-error hover:border-rose-500 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} 삭제
          </button>
        </div>
      </div>

      {/* 상태 + 우선순위 칩 */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${statusColor(item.status)}`}
        >
          {item.status}
        </span>
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${priorityColor(item.priority)}`}
        >
          {item.priority === '긴급' && <AlertTriangle size={10} className="mr-1" />}
          {item.priority}
        </span>
      </div>

      {/* 메인 정보 카드 */}
      <div className="space-y-2 rounded-2xl border border-boss-border bg-boss-surface p-4">
        {/* 요청일 */}
        <div className="flex items-center gap-2 rounded-lg bg-boss-surface px-3 py-2">
          <span className="text-xs font-bold text-indigo-300">요청</span>
          <span className="text-sm font-bold text-boss-text">{formatDate(item.requestDate)}</span>
          <span className="ml-auto text-xs font-bold text-boss-text-secondary">{item.status}</span>
        </div>

        {/* 완료일 */}
        {item.completedDate && (
          <div className="flex items-center gap-2 rounded-lg bg-boss-surface px-3 py-2">
            <span className="text-xs font-bold text-boss-primary">완료</span>
            <span className="text-sm font-bold text-boss-text">{formatDate(item.completedDate)}</span>
          </div>
        )}

        {/* 제목 */}
        <div className="rounded-lg bg-boss-surface px-3 py-2">
          <h2 className="text-base font-bold text-boss-text">{item.title}</h2>
        </div>

        {/* 고객 정보 */}
        <div className="space-y-1.5 rounded-lg bg-boss-surface px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <User size={12} className="text-boss-text-muted" />
            <span className="w-12 text-xs text-boss-text-muted">고객명</span>
            <span className="font-medium text-boss-text">{item.customerName}</span>
          </div>
          {item.customerPhone && (
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-boss-text-muted" />
              <span className="w-12 text-xs text-boss-text-muted">전화</span>
              <a href={`tel:${item.customerPhone}`} className="font-medium text-boss-text hover:text-boss-primary">
                {item.customerPhone}
              </a>
            </div>
          )}
          {item.address && (
            <div className="flex items-start gap-2">
              <MapPin size={12} className="mt-1 text-boss-text-muted" />
              <span className="w-12 text-xs text-boss-text-muted">주소</span>
              <span className="font-medium text-boss-text">{item.address}</span>
            </div>
          )}
        </div>

        {/* 설명 */}
        {item.description && (
          <div className="rounded-lg bg-boss-surface px-3 py-2">
            <p className="mb-1 text-xs text-boss-text-muted">하자 설명</p>
            <p className="whitespace-pre-line text-sm text-boss-text">{item.description}</p>
          </div>
        )}

        {/* 주문 연결 */}
        {item.orderId != null && (
          <div className="flex items-center gap-2 rounded-lg bg-boss-surface px-3 py-2">
            <Receipt size={14} className="text-indigo-300" />
            <span className="text-sm font-semibold text-indigo-300">주문 #{item.orderId} 연결됨</span>
          </div>
        )}
      </div>

      {/* 이미지 탭 */}
      <div className="rounded-2xl border border-boss-border bg-boss-surface p-2">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setTab('defect')}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === 'defect' ? 'bg-boss-surface text-boss-text' : 'text-boss-text-secondary hover:text-boss-text'
            }`}
          >
            <ImageIcon size={12} /> 하자 {defectImages.length}
          </button>
          <button
            type="button"
            onClick={() => setTab('repair')}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === 'repair' ? 'bg-boss-surface text-boss-text' : 'text-boss-text-secondary hover:text-boss-text'
            }`}
          >
            <Wrench size={12} /> 수리 {repairImages.length}
          </button>
        </div>
      </div>

      {/* 이미지 그리드 */}
      <ImageGrid
        images={tab === 'defect' ? defectImages.map((i) => i.filePath) : repairImages.map((i) => i.filePath)}
        emptyMessage={tab === 'defect' ? '등록된 하자 사진이 없습니다' : '등록된 수리 사진이 없습니다'}
      />
    </div>
  );
}

function ImageGrid({ images, emptyMessage }: { images: string[]; emptyMessage: string }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-boss-border bg-boss-surface/30 px-6 py-12 text-center">
        <ImageIcon size={28} className="mb-2 text-boss-text-muted" />
        <p className="text-sm text-boss-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {images.map((url, idx) => (
        <a
          key={`${url}-${idx}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square overflow-hidden rounded-lg border border-boss-border bg-boss-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`AS 이미지 ${idx + 1}`} className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
