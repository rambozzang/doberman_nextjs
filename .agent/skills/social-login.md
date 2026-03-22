---
description: 소셜 로그인 (Google, Kakao, Naver) 구현 및 설정 방법
---

# Social Login

## 지원 프로바이더
- Google
- Kakao (카카오)
- Naver (네이버)

## 관련 파일
- `src/services/socialAuthService.ts`: 소셜 로그인 서비스
- `src/app/auth/[provider]/callback/page.tsx`: 콜백 핸들러
- `src/components/LoginModal.tsx`: 로그인 UI
- `src/components/RegisterModal.tsx`: 회원가입 UI

## 환경변수 설정
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_KAKAO_CLIENT_ID=xxx
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
```

## 상세 문서
- `SOCIAL_LOGIN_SETUP.md`: 설정 가이드
- `SOCIAL_LOGIN_BACKEND_SPEC.md`: 백엔드 API 스펙
- `SOCIAL_LOGIN_DEBUG.md`: 디버깅 가이드

## 동작 흐름
1. 사용자가 소셜 버튼 클릭
2. 팝업에서 OAuth 인증
3. 콜백 페이지에서 code 수신
4. 백엔드 API로 code 전달
5. JWT 발급 및 로그인 완료
