// 소셜 로그인 콜백이 부모 창(팝업을 연 창) 없이 열렸을 때 돌아갈 곳(2026-10-16).
// 휴대폰 브라우저 · 앱 안 브라우저는 팝업 대신 새 탭으로 열거나 부모 창 연결을 끊어서,
// 예전엔 늘 홈('/')으로 가 작성하던 견적이 제출되지 않았다. 대기 중인 견적이 있으면 그 화면으로 돌아가
// 저장된 내용으로 자동 제출되게 한다(키 이름은 각 화면의 PENDING_SUBMIT_KEY 와 같다).
export function socialReturnPath(): string {
  try {
    if (localStorage.getItem('quote_request_pending_submit') === 'true') return '/quote-request';
    if (localStorage.getItem('ai_quote_pending_submit') === 'true') return '/quote-request-ai';
  } catch {
    // 저장소를 못 쓰면 홈으로
  }
  return '/';
}
