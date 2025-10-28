# 소셜 로그인 환경변수 설정 가이드

## 필요한 환경변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# Google OAuth 2.0 설정
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Kakao OAuth 2.0 설정
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_client_id_here

# 백엔드 API 설정 (선택사항)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Google OAuth 2.0 설정 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/auth/google/callback` (개발용)
   - `https://yourdomain.com/auth/google/callback` (프로덕션용)
7. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

## Kakao OAuth 2.0 설정 방법

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. "플랫폼" > "Web 플랫폼 등록"
4. 사이트 도메인 추가:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (프로덕션용)
5. "제품 설정" > "카카오 로그인" 활성화
6. "Redirect URI" 설정:
   - `http://localhost:3000/auth/kakao/callback` (개발용)
   - `https://yourdomain.com/auth/kakao/callback` (프로덕션용)
7. "앱 키"에서 REST API 키 복사

## 보안 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 HTTPS를 사용하세요
- 클라이언트 시크릿은 서버에서만 사용하세요
- 정기적으로 OAuth 키를 갱신하세요

## 테스트 방법

1. 환경변수 설정 완료 후 개발 서버 재시작
2. LoginModal 또는 견적 요청 페이지에서 소셜 로그인 버튼 클릭
3. OAuth 인증 플로우 확인
4. 콜백 페이지에서 로그인 성공 확인
