'use client';

// 사장님 커뮤니티 신고하기 — Industry 패턴
// Flutter `bbs_sigo_page.dart` 를 Next.js 로 포팅.
//
// 가운데 620px 열: 패널 안에 신고 유형(RadioOption) + 상세 사유(TextareaField)
// → 하단 액션 패널(취소 secondary / 신고 접수 primary). 접수는 ConfirmDialog 를 거친다.
// 화면 제목과 «← 커뮤니티» 는 셸 헤더가 그린다.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { bossCommunityApi } from '@/lib/api/boss/community';
import { BossAuthManager } from '@/lib/bossAuth';
import {
  Panel,
  FieldLabel,
  RadioOption,
  TextareaField,
  Button,
  ButtonLink,
  ConfirmDialog,
} from '@/components/boss/ui';

const REASON_OPTIONS: { code: string; label: string; hint: string }[] = [
  { code: 'SPAM', label: '스팸 · 광고성 게시물', hint: '홍보 · 도배' },
  { code: 'ABUSE', label: '욕설 · 혐오 · 비방', hint: '특정인 공격' },
  { code: 'PORN', label: '음란 · 선정적 내용', hint: '' },
  { code: 'COPY', label: '저작권 침해', hint: '무단 복제' },
  { code: 'ETC', label: '기타', hint: '아래에 설명' },
];

export default function BossCommunityReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = params?.id;

  const [reasonCd, setReasonCd] = useState<string>(REASON_OPTIONS[0].code);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const backHref = `/boss/community/${boardId}`;

  const requestSubmit = () => {
    if (!reason.trim()) {
      toast.error('신고 사유를 입력해주세요.');
      return;
    }
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!boardId) return;
    if (!reason.trim()) {
      toast.error('신고 사유를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const me = BossAuthManager.getUserInfo();
      const res = await bossCommunityApi.singo({
        boardId: String(boardId),
        reasonCd,
        userId: me?.userId ?? '',
        reason: reason.trim(),
      });
      if (res.success !== false) {
        toast.success('신고가 접수되었습니다.');
        router.push(backHref);
      } else {
        toast.error(res.message || '신고 실패');
      }
    } catch {
      toast.error('네트워크 오류');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const reasonLabel = REASON_OPTIONS.find((o) => o.code === reasonCd)?.label ?? '';

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
      <Panel kicker="신고" title="게시글 신고">
        <p className="mb-4 text-[12.5px] leading-relaxed text-boss-text-secondary">
          글 #{boardId} 을(를) 신고합니다. 접수된 신고는 운영팀이 확인한 뒤 처리하며, 신고자
          정보는 작성자에게 공개되지 않습니다.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel required>신고 유형</FieldLabel>
            <div role="radiogroup" aria-label="신고 유형" className="flex flex-col gap-1.5">
              {REASON_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt.code}
                  checked={reasonCd === opt.code}
                  onChange={() => setReasonCd(opt.code)}
                  label={opt.label}
                  hint={opt.hint || undefined}
                />
              ))}
            </div>
          </div>

          <TextareaField
            id="reason"
            label="상세 사유"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            placeholder="어떤 부분이 문제인지 구체적으로 적어 주세요. 운영팀이 판단하는 근거가 됩니다."
            hint={`${reason.trim().length.toLocaleString()}자 입력`}
            maxLength={2000}
          />
        </div>
      </Panel>

      {/* 하단 액션 패널 */}
      <div className="boss-card flex flex-wrap items-center justify-end gap-2 px-4 py-3.5">
        <ButtonLink href={backHref} variant="secondary">
          취소
        </ButtonLink>
        <Button variant="primary" onClick={requestSubmit} disabled={submitting}>
          {submitting ? '신고 중…' : '신고 접수'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="primary"
        title="신고를 접수할까요?"
        description={`유형: ${reasonLabel}. 접수한 신고는 취소할 수 없습니다.`}
        confirmLabel="접수"
        loading={submitting}
        onConfirm={() => void submit()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
