'use client';

// 지도 광고 — Industry 패턴 (agent.opentohome.com)
//
// 구조
//   (업체 미등록) 배너 — 실패·차단은 숨기지 않는다
//   → KPI 4장 (StatCard · 실데이터에서만 집계)
//   → 섹션 줄(집행 광고 n · 등급 안내 · 우측 광고 등록)
//   → (열렸을 때) 새 광고 패널: 2열 Field/SelectField + 하단 액션
//   → 광고 표(등급 · 광고 · 지역 · 기간 · 노출 · 클릭 · 클릭률 · 상태 · 중지)
//
// 게시 중지는 ConfirmDialog 를 거친다. 화면 제목은 셸 헤더가 그린다.

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bossAdsApi } from '@/lib/api/boss/ads';
import type { BossAd, BossAdCreateRequest } from '@/types/boss-ad';
import {
  Button,
  ButtonLink,
  StatCard,
  StatusPill,
  Chip,
  chipToneOf,
  AlertBanner,
  ConfirmDialog,
  ContentCard,
  CardHead,
  EmptyState,
  RowSkeleton,
  Panel,
  Field,
  SelectField,
} from '@/components/boss/ui';

const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시',
  '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
];

// 등급이 높으면 지도 마커와 광고 슬롯에서 더 앞에 노출된다
const TIERS = [
  { value: 1, label: '기본' },
  { value: 2, label: '우선' },
  { value: 3, label: '최우선' },
];

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function adStatus(ad: BossAd): { label: string; tone: 'ok' | 'bad' | 'neutral' } {
  if (ad.serving) return { label: '노출 중', tone: 'ok' };
  if (ad.status === 'N') return { label: '중지', tone: 'bad' };
  return { label: '대기', tone: 'neutral' };
}

export default function BossAdsPage() {
  const [ads, setAds] = useState<BossAd[]>([]);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  // 수정 중인 광고 — 있으면 새 광고 등록 패널 대신 이 값으로 채운 수정 패널을 띄운다
  const [editTarget, setEditTarget] = useState<BossAd | null>(null);
  // 중지 확인창에 올라간 광고
  const [stopTarget, setStopTarget] = useState<BossAd | null>(null);
  const [stopping, setStopping] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await bossAdsApi.myList();
      if (res.success && res.data) {
        setAds(res.data.ads ?? []);
        setVendorName(res.data.vendorName);
        setVendorId(res.data.vendorId);
      } else {
        const msg = res.message || res.error || '광고 목록을 불러오지 못했습니다.';
        setLoadError(msg);
        toast.error(msg);
      }
    } catch {
      setLoadError('네트워크 오류로 광고 목록을 불러오지 못했습니다.');
    } finally {
      // 예외가 나도 스피너에 갇히지 않는다
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stop = async (adId: number) => {
    setStopping(true);
    try {
      const res = await bossAdsApi.stop(adId);
      if (res.success) {
        toast.success('게시를 중지했습니다.');
        load();
      } else {
        toast.error(res.message || res.error || '중지에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 중지하지 못했습니다.');
    } finally {
      // 실패해도 다이얼로그가 잠기지 않도록 여기서 반드시 푼다
      setStopping(false);
      setStopTarget(null);
    }
  };

  // 집계 — 실데이터에서만 파생한다
  const totals = ads.reduce(
    (s, a) => ({ imp: s.imp + a.impCnt, click: s.click + a.clickCnt, live: s.live + (a.serving ? 1 : 0) }),
    { imp: 0, click: 0, live: 0 }
  );
  const ctr = totals.imp > 0 ? (totals.click / totals.imp) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ───── 조회 실패 ───── */}
      {loadError && !loading && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load()}>
              다시 시도
            </Button>
          }
        >
          {loadError}
        </AlertBanner>
      )}

      {/* ───── 업체 미등록 — 실패/차단은 숨기지 않는다 ───── */}
      {!loading && !loadError && vendorId == null && (
        <AlertBanner
          tone="warn"
          action={
            <ButtonLink href="/boss/me/company" variant="primary" size="sm">
              업체 등록
            </ButtonLink>
          }
        >
          지도에 등록된 업체가 없어 광고를 집행할 수 없습니다. 회사 주소를 등록하면 지도에
          표시되고 그때부터 광고를 낼 수 있습니다.
        </AlertBanner>
      )}

      {/* ───── KPI 4장 ───── */}
      {(loading || vendorId != null) && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="총 노출"
            value={totals.imp.toLocaleString()}
            delta={totals.live > 0 ? `노출 중 ${totals.live}` : undefined}
            deltaTone="ok"
            hint="집행한 광고의 지도 노출 합계"
            loading={loading}
          />
          <StatCard
            label="총 클릭"
            value={totals.click.toLocaleString()}
            hint="지도에서 업체를 누른 횟수"
            loading={loading}
          />
          <StatCard
            label="클릭률"
            value={`${ctr.toFixed(1)}%`}
            delta={ctr >= 2 ? '양호' : ctr > 0 ? '개선 여지' : undefined}
            deltaTone={ctr >= 2 ? 'ok' : 'warn'}
            hint="클릭 ÷ 노출"
            loading={loading}
          />
          <StatCard
            label="집행 중"
            value={String(totals.live)}
            delta={`전체 ${ads.length}`}
            deltaTone="neutral"
            hint="지금 지도에 노출되는 광고"
            loading={loading}
          />
        </section>
      )}

      {/* ───── 섹션 줄 ───── */}
      {vendorId != null && (
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-[12px] text-boss-text-muted">
            등급이 높을수록 지도 마커와 광고 슬롯에서 앞에 노출됩니다
            {vendorName && ` · ${vendorName}`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-boss-head text-[13px] tabular-nums text-boss-text-secondary">
              {loading ? '불러오는 중…' : `전체 ${ads.length}건`}
            </span>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load()} disabled={loading}>
              새로고침
            </Button>
            <Button
              variant={showForm ? 'secondary' : 'primary'}
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditTarget(null);
                setShowForm((v) => !v);
              }}
            >
              {showForm ? '등록 닫기' : '광고 등록'}
            </Button>
          </div>
        </div>
      )}

      {!loading && vendorId != null && (showForm || editTarget) && (
        <AdForm
          initial={editTarget}
          onCancel={() => {
            setShowForm(false);
            setEditTarget(null);
          }}
          onDone={() => {
            setShowForm(false);
            setEditTarget(null);
            load();
          }}
        />
      )}

      {/* ───── 광고 표 ───── */}
      {loading ? (
        <ContentCard>
          <RowSkeleton rows={4} />
        </ContentCard>
      ) : vendorId != null ? (
        ads.length === 0 ? (
          <EmptyState
            title="아직 등록한 광고가 없습니다"
            description="광고를 등록하면 게시 기간 동안 지도 마커와 광고 슬롯에 업체가 앞서 노출됩니다. 노출 · 클릭은 여기서 집계됩니다."
            action={
              !showForm ? (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
                  첫 광고 등록
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ContentCard>
            <CardHead title="집행 광고" meta="최근 등록 순" count={`${ads.length}건`} countTone="muted" />
            <div className="boss-scroll overflow-x-auto">
              <table className="boss-table">
                <thead>
                  <tr>
                    <th>등급</th>
                    <th>광고</th>
                    <th>지역</th>
                    <th>기간</th>
                    <th className="num">노출</th>
                    <th className="num">클릭</th>
                    <th className="num">클릭률</th>
                    <th>상태</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => {
                    const tier = TIERS.find((t) => t.value === ad.tier)?.label ?? String(ad.tier);
                    const region = ad.regionSido
                      ? `${ad.regionSido}${ad.regionSigungu ? ' ' + ad.regionSigungu : ''}`
                      : '전국';
                    const status = adStatus(ad);
                    return (
                      <tr key={ad.adId}>
                        <td>
                          <span className="flex items-center gap-2">
                            <Chip tone={chipToneOf(tier)}>{tier.charAt(0)}</Chip>
                            <span className="text-boss-text-secondary">{tier}</span>
                          </span>
                        </td>
                        <td className="wrap min-w-[220px] max-w-[360px]">
                          <p className="font-semibold text-boss-text">{ad.title}</p>
                          {ad.body && (
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-boss-text-secondary">{ad.body}</p>
                          )}
                        </td>
                        <td className="text-boss-text-secondary">{region}</td>
                        <td className="font-boss-head text-[12.5px] tabular-nums text-boss-text-secondary">
                          {ad.startDt} ~ {ad.endDt}
                        </td>
                        <td className="num">{ad.impCnt.toLocaleString()}</td>
                        <td className="num">{ad.clickCnt.toLocaleString()}</td>
                        <td className="num">
                          {ad.impCnt > 0 ? `${((ad.clickCnt / ad.impCnt) * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td>
                          <StatusPill tone={status.tone}>{status.label}</StatusPill>
                        </td>
                        <td className="text-right">
                          <span className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowForm(false);
                                setEditTarget(ad);
                              }}
                            >
                              수정
                            </Button>
                            {ad.status === 'Y' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStopTarget(ad)}
                                className="!text-boss-text-muted hover:!text-boss-error"
                              >
                                중지
                              </Button>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ContentCard>
        )
      ) : null}

      <ConfirmDialog
        open={stopTarget !== null}
        title={stopTarget ? `«${stopTarget.title}» 게시를 중지할까요?` : ''}
        description="중지하면 지도에서 바로 내려가며 다시 켤 수 없습니다. 다시 노출하려면 새 광고를 등록해야 합니다."
        confirmLabel="게시 중지"
        loading={stopping}
        onConfirm={() => stopTarget && void stop(stopTarget.adId)}
        onCancel={() => setStopTarget(null)}
      />
    </div>
  );
}

function AdForm({
  initial,
  onCancel,
  onDone,
}: {
  /** 있으면 수정 모드 — 이 값으로 폼을 채우고 저장 시 update 를 호출한다 */
  initial?: BossAd | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<BossAdCreateRequest>(() =>
    initial
      ? {
          tier: initial.tier,
          title: initial.title,
          body: initial.body ?? '',
          landingUrl: initial.landingUrl ?? '',
          imageUrl: initial.imageUrl ?? '',
          regionSido: initial.regionSido ?? '',
          regionSigungu: initial.regionSigungu ?? '',
          startDt: initial.startDt,
          endDt: initial.endDt,
        }
      : {
          tier: 1,
          title: '',
          body: '',
          landingUrl: '',
          imageUrl: '',
          regionSido: '',
          regionSigungu: '',
          startDt: today(),
          endDt: today(30),
        },
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BossAdCreateRequest>(key: K, value: BossAdCreateRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error('광고 제목을 입력해 주세요.');
      return;
    }
    if (form.endDt < form.startDt) {
      toast.error('종료일이 시작일보다 앞설 수 없습니다.');
      return;
    }
    setSaving(true);
    const payload: BossAdCreateRequest = {
      ...form,
      title: form.title.trim(),
      body: form.body?.trim() || undefined,
      landingUrl: form.landingUrl?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
      regionSido: form.regionSido || undefined,
      regionSigungu: form.regionSigungu?.trim() || undefined,
    };
    const res =
      isEdit && initial ? await bossAdsApi.update(initial.adId, payload) : await bossAdsApi.create(payload);
    setSaving(false);
    if (res.success) {
      toast.success(isEdit ? '광고를 수정했습니다.' : '광고를 등록했습니다.');
      onDone();
    } else {
      toast.error(res.message || res.error || (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.'));
    }
  };

  return (
    <Panel kicker={isEdit ? '광고 수정' : '새 광고'} title={isEdit ? '광고 수정' : '광고 등록'}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field
          id="ad-title"
          label="광고 제목"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={120}
          placeholder="강남 도배 20년 경력"
        />
        <SelectField
          id="ad-tier"
          label="노출 등급"
          value={form.tier}
          onChange={(e) => set('tier', Number(e.target.value))}
          hint="등급이 높을수록 지도에서 앞에 나옵니다"
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <Field
          id="ad-body"
          label="광고 문구"
          className="md:col-span-2"
          value={form.body ?? ''}
          onChange={(e) => set('body', e.target.value)}
          maxLength={300}
          placeholder="합지 · 실크 전문, 당일 견적"
        />
        <SelectField
          id="ad-sido"
          label="노출 지역"
          value={form.regionSido ?? ''}
          onChange={(e) => set('regionSido', e.target.value)}
          hint="비우면 전국에 노출됩니다"
        >
          <option value="">전국</option>
          {SIDO_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <Field
          id="ad-sigungu"
          label="시군구"
          value={form.regionSigungu ?? ''}
          onChange={(e) => set('regionSigungu', e.target.value)}
          placeholder="강남구"
          disabled={!form.regionSido}
          hint="비우면 시도 전체에 노출됩니다"
          maxLength={100}
        />
        <Field
          id="ad-start"
          label="게시 시작일"
          type="date"
          value={form.startDt}
          onChange={(e) => set('startDt', e.target.value)}
        />
        <Field
          id="ad-end"
          label="게시 종료일"
          type="date"
          value={form.endDt}
          onChange={(e) => set('endDt', e.target.value)}
        />
        <Field
          id="ad-image"
          label="이미지 URL (선택)"
          value={form.imageUrl ?? ''}
          onChange={(e) => set('imageUrl', e.target.value)}
          placeholder="https://..."
          maxLength={500}
        />
        <Field
          id="ad-landing"
          label="클릭 시 이동 (선택)"
          value={form.landingUrl ?? ''}
          onChange={(e) => set('landingUrl', e.target.value)}
          placeholder="https://..."
          hint="비우면 지도의 업체 상세로 이동합니다"
          maxLength={500}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-boss-border pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? (isEdit ? '수정 중…' : '등록 중…') : isEdit ? '수정' : '등록'}
        </Button>
      </div>
    </Panel>
  );
}
