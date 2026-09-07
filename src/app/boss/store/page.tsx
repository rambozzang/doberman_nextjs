'use client';

// 도배 용품 관리 — 쿠팡 파트너스 상품을 검색해 담고, 소비자 페이지(/도배-용품)에 노출한다
//
// 운영자(admin.user-ids)만 쓴다. 메뉴는 운영자에게만 보이고, 서버도 관리자만 통과시킨다.
//   · 검색해서 담기 : 키워드 → 쿠팡 검색 → 분류 골라 담기 (딥링크 · 사진 · 가격 자동)
//   · URL 로 담기   : 쿠팡 상품 주소 → 딥링크 변환 (이름 · 가격은 직접)
//   · 목록          : 등록일 맨 앞 · 노출 켜기/끄기 · 순서 · 클릭 수 · 삭제

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Search, Link2, RefreshCw, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, ExternalLink, Plus } from 'lucide-react';
import { bossStoreApi } from '@/lib/api/boss/store';
import { currentBossIsAdmin } from '@/lib/boss/admin';
import ListDateCell from '@/components/boss/ListDateCell';
import {
  Panel,
  Button,
  ButtonLink,
  DataTable,
  Field,
  SelectField,
  EmptyState,
  RowSkeleton,
  AlertBanner,
  ConfirmDialog,
  Tag,
  Badge,
} from '@/components/boss/ui';
import {
  STORE_CATEGORY_ORDER,
  COUPANG_PARTNERS_NOTICE,
  type StoreCategory,
  type StoreProduct,
  type StoreSearchItem,
} from '@/types/store';

function won(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return `₩${n.toLocaleString('ko-KR')}`;
}

export default function BossStorePage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 검색해서 담기
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<StoreSearchItem[] | null>(null);
  const [pickCategory, setPickCategory] = useState<string>('WALLPAPER');
  const [adding, setAdding] = useState<string | null>(null);

  // URL 로 담기
  const [urlForm, setUrlForm] = useState({ coupangUrl: '', productName: '', productPrice: '', productImage: '' });
  const [urlSaving, setUrlSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<StoreProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    setAdmin(currentBossIsAdmin());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bossStoreApi.list();
      if (res.success !== false && res.data) {
        setConfigured(res.data.configured);
        setCategories(res.data.categories);
        setProducts(res.data.products);
      } else {
        setError(res.message || res.error || '목록을 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류로 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) void load();
  }, [admin, load]);

  const categoryOptions = useMemo(() => {
    const byCode = new Map(categories.map((c) => [c.code, c]));
    return STORE_CATEGORY_ORDER.map((code) => byCode.get(code) ?? { code, label: code, count: 0 });
  }, [categories]);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    const kw = keyword.trim();
    if (!kw) {
      toast.error('검색어를 입력하세요.');
      return;
    }
    setSearching(true);
    try {
      const res = await bossStoreApi.search(kw, 20);
      if (res.success !== false && res.data) {
        setResults(res.data);
        if (res.data.length === 0) toast('검색 결과가 없습니다.');
      } else {
        toast.error(res.message || res.error || '검색에 실패했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 검색하지 못했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const addFromSearch = async (item: StoreSearchItem) => {
    const key = String(item.productId ?? item.productUrl);
    setAdding(key);
    try {
      const res = await bossStoreApi.addFromSearch({
        categoryCode: pickCategory,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        productImage: item.productImage,
        productUrl: item.productUrl,
        coupangCategory: item.categoryName,
        isRocket: item.isRocket,
        isFreeShipping: item.isFreeShipping,
        keyword: keyword.trim(),
      });
      if (res.success !== false) {
        toast.success('담았습니다.');
        setResults((r) => r?.map((x) => (x === item ? { ...x, registered: true } : x)) ?? r);
        await load();
      } else {
        toast.error(res.message || res.error || '담지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 담지 못했습니다.');
    } finally {
      setAdding(null);
    }
  };

  const addFromUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!urlForm.coupangUrl.trim() || !urlForm.productName.trim()) {
      toast.error('쿠팡 상품 주소와 상품명을 입력하세요.');
      return;
    }
    setUrlSaving(true);
    try {
      const price = Number(urlForm.productPrice.replace(/[^\d]/g, ''));
      const res = await bossStoreApi.addFromUrl({
        categoryCode: pickCategory,
        coupangUrl: urlForm.coupangUrl.trim(),
        productName: urlForm.productName.trim(),
        productPrice: price > 0 ? price : null,
        productImage: urlForm.productImage.trim() || null,
      });
      if (res.success !== false) {
        toast.success('담았습니다.');
        setUrlForm({ coupangUrl: '', productName: '', productPrice: '', productImage: '' });
        await load();
      } else {
        toast.error(res.message || res.error || '담지 못했습니다.');
      }
    } catch {
      toast.error('네트워크 오류로 담지 못했습니다.');
    } finally {
      setUrlSaving(false);
    }
  };

  const toggleUse = async (p: StoreProduct) => {
    setBusyId(p.id);
    try {
      const res = await bossStoreApi.update(p.id, { useYn: p.useYn === 'Y' ? 'N' : 'Y' });
      if (res.success !== false) await load();
      else toast.error(res.message || res.error || '바꾸지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const changeCategory = async (p: StoreProduct, categoryCode: string) => {
    setBusyId(p.id);
    try {
      const res = await bossStoreApi.update(p.id, { categoryCode });
      if (res.success !== false) await load();
      else toast.error(res.message || res.error || '바꾸지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  /** 같은 분류 안에서 한 칸 위/아래 */
  const move = async (p: StoreProduct, dir: -1 | 1) => {
    const same = products.filter((x) => x.categoryCode === p.categoryCode);
    const i = same.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= same.length) return;
    const ids = same.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setBusyId(p.id);
    try {
      const res = await bossStoreApi.reorder(ids);
      if (res.success !== false) await load();
      else toast.error(res.message || res.error || '순서를 바꾸지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    const t = pendingDelete;
    if (!t) return;
    setDeleting(true);
    try {
      const res = await bossStoreApi.remove(t.id);
      if (res.success !== false) {
        toast.success('지웠습니다.');
        setPendingDelete(null);
        await load();
      } else {
        toast.error(res.message || res.error || '지우지 못했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (admin === false) {
    return (
      <EmptyState
        title="운영자만 쓸 수 있는 화면입니다"
        description="도배 용품 페이지는 소비자 사이트에서 볼 수 있습니다."
        action={
          <ButtonLink href="https://www.doberman.kr/도배-용품" variant="secondary" size="sm">
            도배 용품 보기
          </ButtonLink>
        }
      />
    );
  }

  const visible = products.filter((p) => p.useYn === 'Y').length;

  return (
    <div className="flex flex-col gap-4">
      {!configured && !loading && (
        <AlertBanner tone="bad">
          서버에 쿠팡 파트너스 API 키가 없어 검색 · URL 담기가 동작하지 않습니다. 서버의 openai.env 에
          COUPANG_ACCESS_KEY · COUPANG_SECRET_KEY 를 넣고 재시작하세요.
        </AlertBanner>
      )}
      {error && (
        <AlertBanner
          tone="bad"
          action={
            <Button variant="primary" size="sm" onClick={() => load()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ───── 좌: 담기 + 목록 ───── */}
        <div className="flex flex-col gap-4">
          <Panel kicker="담기" title="쿠팡에서 찾아 담기">
            <form onSubmit={onSearch} className="flex flex-wrap items-end gap-2">
              <Field
                id="store-keyword"
                label="검색어"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예) 도배풀, 실크벽지, 초배지, 도배 헤라"
                className="min-w-[220px] flex-1"
                maxLength={100}
                hideCounter
              />
              <SelectField
                id="store-category"
                label="담을 분류"
                value={pickCategory}
                onChange={(e) => setPickCategory(e.target.value)}
                className="w-[160px]"
              >
                {categoryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </SelectField>
              <Button type="submit" variant="primary" icon={Search} disabled={searching || !configured}>
                {searching ? '검색 중…' : '검색'}
              </Button>
            </form>

            {results && (
              <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                {results.map((r) => {
                  const key = String(r.productId ?? r.productUrl);
                  return (
                    <li key={key} className="flex flex-col border border-boss-border bg-white">
                      <div className="aspect-square w-full overflow-hidden bg-white">
                        {r.productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element -- 쿠팡 CDN 이미지
                          <img src={r.productImage} alt="" className="h-full w-full object-contain" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-2.5">
                        <p className="line-clamp-2 text-[12.5px] leading-snug text-boss-text">{r.productName}</p>
                        <p className="font-boss-head text-[13px] font-semibold tabular-nums text-boss-text">
                          {won(r.productPrice)}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.isRocket && <Tag tone="info">로켓</Tag>}
                          {r.isFreeShipping && <Tag tone="ok">무료배송</Tag>}
                        </div>
                        <div className="mt-auto pt-1">
                          {r.registered ? (
                            <Badge tone="emerald">담김</Badge>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Plus}
                              onClick={() => addFromSearch(r)}
                              disabled={adding === key}
                              className="w-full"
                            >
                              {adding === key ? '담는 중…' : '담기'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel kicker="담기" title="쿠팡 상품 주소로 담기">
            <form onSubmit={addFromUrl} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                id="store-url"
                label="쿠팡 상품 주소"
                value={urlForm.coupangUrl}
                onChange={(e) => setUrlForm((f) => ({ ...f, coupangUrl: e.target.value }))}
                placeholder="https://www.coupang.com/vp/products/…"
                className="md:col-span-2"
                maxLength={500}
              />
              <Field
                id="store-url-name"
                label="상품명"
                value={urlForm.productName}
                onChange={(e) => setUrlForm((f) => ({ ...f, productName: e.target.value }))}
                placeholder="고객에게 보일 이름"
                maxLength={500}
              />
              <Field
                id="store-url-price"
                label="가격(원)"
                inputMode="numeric"
                value={urlForm.productPrice}
                onChange={(e) => setUrlForm((f) => ({ ...f, productPrice: e.target.value.replace(/[^\d]/g, '') }))}
                placeholder="비워도 됩니다"
                maxLength={500}
              />
              <Field
                id="store-url-image"
                label="사진 주소"
                value={urlForm.productImage}
                onChange={(e) => setUrlForm((f) => ({ ...f, productImage: e.target.value }))}
                placeholder="https://… (비워도 됩니다)"
                className="md:col-span-2"
                maxLength={500}
              />
              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <span className="mr-auto text-[12px] text-boss-text-secondary">
                  위에서 고른 분류({categoryOptions.find((c) => c.code === pickCategory)?.label})에 담깁니다.
                </span>
                <Button type="submit" variant="secondary" icon={Link2} disabled={urlSaving || !configured}>
                  {urlSaving ? '담는 중…' : '주소로 담기'}
                </Button>
              </div>
            </form>
          </Panel>

          <Panel
            kicker="목록"
            title={`담은 상품 ${products.length}개 · 노출 ${visible}개`}
            right={
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load()} disabled={loading}>
                새로고침
              </Button>
            }
          >
            {loading && products.length === 0 ? (
              <RowSkeleton rows={4} />
            ) : products.length === 0 ? (
              <EmptyState
                title="담은 상품이 없습니다"
                description="위에서 쿠팡을 검색해 담으면 소비자 사이트 도배 용품 페이지에 바로 보입니다."
              />
            ) : (
              <div className="boss-scroll -mx-5 overflow-x-auto">
                <DataTable className="border-x-0">
                  <thead>
                    <tr>
                      <th>등록일</th>
                      <th>상품</th>
                      <th>분류</th>
                      <th className="text-right">가격</th>
                      <th className="text-right">클릭</th>
                      <th>노출</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className={p.useYn === 'N' ? 'opacity-60' : ''}>
                        <td>
                          <ListDateCell at={p.createdDt} id={p.id} />
                        </td>
                        <td className="wrap max-w-[360px]">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 shrink-0 overflow-hidden border border-boss-border bg-white">
                              {p.productImage ? (
                                // eslint-disable-next-line @next/next/no-img-element -- 쿠팡 CDN 이미지
                                <img src={p.productImage} alt="" className="h-full w-full object-contain" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="nofollow noopener"
                                className="line-clamp-2 text-[13px] font-medium !text-boss-text hover:underline"
                              >
                                {p.productName}
                              </a>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-boss-text-muted">
                                {p.isRocket && <Tag tone="info">로켓</Tag>}
                                {p.isFreeShipping && <Tag tone="ok">무료배송</Tag>}
                                {p.keyword ? <span>검색어 {p.keyword}</span> : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="boss-input h-8 w-[130px] py-0 text-[12.5px]"
                            value={p.categoryCode}
                            onChange={(e) => changeCategory(p, e.target.value)}
                            disabled={busyId === p.id}
                            aria-label="분류"
                          >
                            {categoryOptions.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="num text-boss-text">{won(p.productPrice)}</td>
                        <td className="num text-boss-text-secondary">{p.clickCnt.toLocaleString('ko-KR')}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleUse(p)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center gap-1 text-[12.5px] text-boss-text hover:underline"
                            title={p.useYn === 'Y' ? '누르면 숨깁니다' : '누르면 보입니다'}
                          >
                            {p.useYn === 'Y' ? (
                              <>
                                <Eye size={14} className="text-boss-primary" /> 보임
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} /> 숨김
                              </>
                            )}
                          </button>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconBtn title="위로" onClick={() => move(p, -1)} disabled={busyId === p.id}>
                              <ArrowUp size={13} />
                            </IconBtn>
                            <IconBtn title="아래로" onClick={() => move(p, 1)} disabled={busyId === p.id}>
                              <ArrowDown size={13} />
                            </IconBtn>
                            <a
                              href={p.productUrl}
                              target="_blank"
                              rel="nofollow noopener"
                              className="inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted hover:bg-boss-elevated hover:!text-boss-text"
                              title="쿠팡에서 보기"
                            >
                              <ExternalLink size={13} />
                            </a>
                            <IconBtn title="지우기" danger onClick={() => setPendingDelete(p)} disabled={busyId === p.id}>
                              <Trash2 size={13} />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            )}
          </Panel>
        </div>

        {/* ───── 우: 안내 ───── */}
        <div className="flex flex-col gap-4">
          <Panel kicker="소비자 페이지" title="도배 용품">
            <p className="text-[12.5px] leading-relaxed text-boss-text-secondary">
              담은 상품은 도배르만 사이트의 <b className="text-boss-text">/도배-용품</b> 페이지에 바로 보입니다(10분 안에
              반영). 고객이 그 링크로 들어가 24시간 안에 산 상품에 수수료가 붙습니다.
            </p>
            <ButtonLink href="https://www.doberman.kr/도배-용품" variant="secondary" size="sm" className="mt-3">
              페이지 열어 보기
            </ButtonLink>
          </Panel>
          <Panel kicker="분류별" title="담은 수">
            <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1 text-[13px]">
              {categoryOptions.map((c) => (
                <div key={c.code} className="contents">
                  <dt className="text-boss-text-secondary">{c.label}</dt>
                  <dd className="font-boss-head tabular-nums text-boss-text">{c.count}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel kicker="규정" title="쿠팡 파트너스">
            <ul className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed text-boss-text-secondary">
              <li>· 고지 문구가 페이지 위에 항상 보입니다: “{COUPANG_PARTNERS_NOTICE}”</li>
              <li>· 가격은 담은 시점 기준입니다. 쿠팡에서 바뀌면 여기서 고치거나 다시 담으세요.</li>
              <li>· 수수료 · 매출은 쿠팡 파트너스 사이트의 리포트에서 확인합니다.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="상품 지우기"
        description={`'${pendingDelete?.productName ?? ''}' 을(를) 목록에서 지웁니다. 소비자 페이지에서도 사라집니다.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center !text-boss-text-muted hover:bg-boss-elevated disabled:opacity-40 ${
        danger ? 'hover:!text-boss-error' : 'hover:!text-boss-text'
      }`}
    >
      {children}
    </button>
  );
}
