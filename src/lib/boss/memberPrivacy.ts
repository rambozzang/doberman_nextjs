import type { PlatformMember } from '@/types/boss-platform-admin';

export const MEMBER_PRIVATE_FIELDS = ['userId', 'name', 'nickName', 'companyName', 'phone', 'email'] as const;
export type MemberPrivateField = (typeof MEMBER_PRIVATE_FIELDS)[number];
export type ProtectedPlatformMember = PlatformMember & { privacyMasked: true; isSelf: boolean; isOperator: boolean };
export type MemberFieldValue = { memberId: number; field: MemberPrivateField; value: string | null; expiresInSeconds: number };

/** 응답은 요청한 회원·항목 하나여야 한다. TTL은 서버가 더 길게 보내도 10초로 제한한다. */
export function parseMemberFieldValue(raw: unknown, memberId: number, field: MemberPrivateField): MemberFieldValue | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.memberId !== memberId || r.field !== field || (r.value !== null && typeof r.value !== 'string') ||
    typeof r.expiresInSeconds !== 'number' || !Number.isFinite(r.expiresInSeconds) || r.expiresInSeconds <= 0) return null;
  return { memberId, field, value: r.value, expiresInSeconds: Math.min(10, r.expiresInSeconds) };
}

export type MemberRevealState = {
  key: string;
  loading: boolean;
  revealed: boolean;
  value: string | null;
  error: string | null;
} | null;

type RevealResult = { ok: true; data: MemberFieldValue } | { ok: false; failure: string; message: string };

/** 원본은 동시에 한 항목만 보관한다. 취소된 요청의 늦은 응답도 다시 표시하지 않는다. */
export class MemberRevealSession {
  private state: MemberRevealState = null;
  private revision = 0;
  private delay?: ReturnType<typeof setTimeout>;
  private expiry?: ReturnType<typeof setTimeout>;
  private request?: AbortController;

  constructor(private readonly options: {
    current: () => boolean;
    send: (id: number, field: MemberPrivateField, signal: AbortSignal) => Promise<RevealResult>;
    change: (state: MemberRevealState) => void;
    forbidden: () => void;
  }) {}

  show(key: string, id: number, field: MemberPrivateField): void {
    if (!this.options.current()) { this.hide(); return; }
    if (this.state?.key === key) return;
    this.hide();
    const revision = this.revision;
    this.publish({ key, loading: true, revealed: false, value: null, error: null });
    // 커서가 스쳐 지나가는 것만으로 원본 조회·감사 이력이 쌓이지 않게 한다.
    this.delay = setTimeout(async () => {
      if (revision !== this.revision || !this.options.current()) { this.hide(key); return; }
      const controller = new AbortController();
      this.request = controller;
      try {
        const result = await this.options.send(id, field, controller.signal);
        if (revision !== this.revision || controller.signal.aborted) return;
        if (!this.options.current()) { this.hide(); return; }
        if (!result.ok) {
          if (result.failure === 'forbidden') { this.hide(); this.options.forbidden(); return; }
          this.publish({ key, loading: false, revealed: false, value: null, error: result.message });
          return;
        }
        const data = parseMemberFieldValue(result.data, id, field);
        if (!data) {
          this.publish({ key, loading: false, revealed: false, value: null, error: '정보를 확인하지 못했습니다.' });
          return;
        }
        this.publish({ key, loading: false, revealed: true, value: data.value, error: null });
        this.expiry = setTimeout(() => this.hide(key), data.expiresInSeconds * 1000);
      } catch {
        if (revision !== this.revision || controller.signal.aborted) return;
        this.publish({ key, loading: false, revealed: false, value: null, error: '연결을 확인한 뒤 다시 시도해 주세요.' });
      }
    }, 350);
  }

  hide(key?: string): void {
    if (key && this.state?.key !== key) return;
    this.revision++;
    clearTimeout(this.delay);
    clearTimeout(this.expiry);
    this.request?.abort();
    this.request = undefined;
    this.publish(null);
  }

  private publish(state: MemberRevealState): void {
    this.state = state;
    this.options.change(state);
  }
}
