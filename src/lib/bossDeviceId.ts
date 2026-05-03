// 사장님(boss) 전용 Device-ID 관리
// Flutter 앱은 각 기기마다 고유한 Device-ID 를 Authorization 헤더와 함께 전송한다.
// 웹 브라우저에는 기기 ID 개념이 없으므로 localStorage 에 UUID 를 생성·저장하고 재사용한다.
//
// 동작 흐름:
//   1. localStorage 에 'boss_device_id' 가 없으면 crypto.randomUUID() 로 생성
//   2. 생성된 ID 를 localStorage 에 저장
//   3. 이후 모든 private API 요청에 'Device-ID' 헤더로 첨부
//
// NOTE: 백엔드 CORS allowedHeaders 에 'Device-ID' 가 추가돼야 실제로 전송된다.
//       그 전까지는 브라우저 preflight 에서 차단되지만, 클라이언트 코드는 미리 준비해둔다.

const BOSS_DEVICE_ID_KEY = 'boss_device_id';

/**
 * Device-ID 를 가져온다. 없으면 새로 생성해 localStorage 에 저장한다.
 * SSR 환경(window 없음)에서는 null 을 반환한다.
 */
export function ensureDeviceId(): string | null {
  if (typeof window === 'undefined') return null;

  const existing = localStorage.getItem(BOSS_DEVICE_ID_KEY);
  if (existing) return existing;

  const newId = crypto.randomUUID();
  localStorage.setItem(BOSS_DEVICE_ID_KEY, newId);
  return newId;
}

/**
 * 저장된 Device-ID 를 조회만 한다 (없으면 null).
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BOSS_DEVICE_ID_KEY);
}
