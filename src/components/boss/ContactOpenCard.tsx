'use client';

// 내 연락처를 견적 요청 고객에게 소개 — 켜기 · 끄기 (2026-10-23)
//
//   고객이 웹견적 요청을 마치면 같은 지역 사장님 3곳의 업체명 · 대표 전화 · 활동 지역 · 소개를 바로 보여 준다.
//   전화번호는 대부분 휴대폰이라 사장님이 직접 켠 경우에만 보인다. 켤 때는 무엇이 보이는지 먼저 펼쳐 보여 주고
//   '동의하고 켜기'를 눌러야 켜진다. 끄면 이미 소개된 요청에서도 바로 사라진다(서버가 읽을 때마다 확인).
//   회사는 서버가 로그인한 계정으로 찾는다 — 화면이 회사 번호를 보내지 않는다.

import { Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { bossCompanyApi } from '@/lib/api/boss/company';
import { isCurrentScope, useBossScope } from '@/lib/boss/bossScope';
import type { BossContactOpenStatus } from '@/types/boss';
import { Button, ButtonLink, Toggle } from '@/components/boss/ui';

export default function ContactOpenCard() {
  const scope = useBossScope();
  const [status, setStatus] = useState<BossContactOpenStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!scope) return;
    let alive = true;
    setStatus(null);
    setFailed(false);
    setConfirming(false);
    void bossCompanyApi.contactOpen().then((res) => {
      if (!alive || !isCurrentScope(scope)) return;
      if (res.success && res.data) setStatus(res.data);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [scope]);

  // 읽지 못하면(서버 준비 전 등) 이 칸을 그리지 않는다 — 요청 목록 사용을 막지 않는다
  if (!scope || failed || !status) return null;

  const save = async (open: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await bossCompanyApi.setContactOpen(open);
      if (!isCurrentScope(scope)) return;
      if (res.success && res.data) {
        setStatus(res.data);
        setConfirming(false);
        toast.success(open ? '견적 요청 고객에게 내 연락처를 소개합니다.' : '연락처 소개를 껐습니다.');
      } else {
        toast.error(res.error || res.message || '잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSaving(false);
    }
  };

  const canOpen = status.companyRegistered && !!status.phone;

  return (
    <div
      className={`border px-4 py-3 ${status.open ? 'border-boss-border bg-boss-surface' : 'border-boss-primary/30 bg-boss-primary/5'}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Phone size={15} strokeWidth={1.75} className="shrink-0 text-boss-text-secondary" />
        <span className="boss-mono-label">고객에게 내 연락처 소개</span>
        {status.open ? (
          <span className="text-[13px] text-boss-text">
            <span className="font-semibold">켜짐</span>
            <span className="text-boss-text-secondary">
              {' '}
              — 최근 30일 {status.shown30}건 소개 · 전화 누름 {status.calls30}회
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-boss-text-secondary">
            켜면 견적을 요청한 내 지역 고객에게 업체명 · 대표 전화가 소개되어, 견적서 없이도 전화로 상담할 수 있습니다
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!status.companyRegistered ? (
            <ButtonLink href="/boss/me/company" variant="secondary" size="sm">
              회사 등록하기
            </ButtonLink>
          ) : !status.phone ? (
            <ButtonLink href="/boss/me/company" variant="secondary" size="sm">
              대표 전화 넣기
            </ButtonLink>
          ) : (
            <Toggle
              checked={status.open}
              disabled={saving}
              label="고객에게 내 연락처 소개"
              onChange={(next) => (next ? setConfirming(true) : void save(false))}
            />
          )}
        </div>
      </div>

      {confirming && canOpen && (
        <div className="mt-3 border-t border-boss-border pt-3 text-[13px] text-boss-text">
          <p className="font-semibold">견적을 요청한 고객에게 아래 정보가 보입니다.</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-boss-text-secondary">
            <li>
              업체명 <span className="text-boss-text">{status.companyName}</span> · 대표 전화{' '}
              <span className="text-boss-text">{status.phone}</span>
            </li>
            <li>활동 지역(회사 주소의 시 · 군 · 구)과 회사 소개 앞부분</li>
            <li>한 요청에 3곳까지, 동의한 사장님 중에서 돌아가며 소개합니다</li>
          </ul>
          <p className="mt-1.5 text-boss-text-secondary">
            언제든 끌 수 있고, 끄면 이미 소개된 요청에서도 바로 사라집니다.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" disabled={saving} onClick={() => void save(true)}>
              동의하고 켜기
            </Button>
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => setConfirming(false)}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
