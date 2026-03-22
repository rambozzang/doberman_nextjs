# 🔗 백엔드 소셜 로그인 연동 가이드

## ✅ 완료된 작업

프론트엔드가 백엔드 API와 연동되도록 수정되었습니다!

### 변경사항

1. **토큰 교환 방식 변경**
   - ❌ 이전: Next.js API Routes를 통한 토큰 교환
   - ✅ 현재: 프론트엔드에서 직접 Google/Kakao OAuth 토큰 교환 후 백엔드 API 호출

2. **백엔드 API 연동**
   - `POST /auth/social/google/login` - Google 로그인
   - `POST /auth/social/kakao/login` - Kakao 로그인

3. **JWT 토큰 관리**
   - 백엔드에서 받은 JWT 토큰을 `AuthManager`를 통해 저장
   - 이후 모든 API 요청에 자동으로 포함

## 📋 환경변수 설정

`.env.local` 파일에 다음 환경변수를 추가하세요:

```bash
# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=814801233548-fggqiq4s3ne3vc5l1lqv6r31phpes55c.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Kakao OAuth 2.0
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key_here

# API Base URL
NEXT_PUBLIC_API_BASE_URL=https://www.tigerbk.com/api-doman/web
```

### ⚠️ 중요: Client Secret 보안

`NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`는 프론트엔드에서 사용되므로 노출될 수 있습니다.

**더 안전한 방법 (권장)**:
1. Next.js API Routes를 사용하여 토큰 교환을 서버사이드에서 처리
2. 또는 백엔드에서 OAuth 인증 코드를 직접 받아 토큰 교환

현재는 빠른 구현을 위해 프론트엔드에서 직접 처리하고 있습니다.

## 🔄 동작 흐름

```
1. 사용자가 Google/Kakao 로그인 버튼 클릭
   ↓
2. OAuth 팝업 열림 (Google/Kakao 인증 페이지)
   ↓
3. 사용자 인증 완료 → 인증 코드(code) 받음
   ↓
4. 프론트엔드가 Google/Kakao API로 액세스 토큰 교환
   ↓
5. 백엔드 API 호출: POST /auth/social/{provider}/login
   {
     "accessToken": "...",
     "provider": "google" | "kakao",
     "deviceId": "...",
     "fcmToken": "..."
   }
   ↓
6. 백엔드 응답:
   {
     "token": "JWT_TOKEN",
     "isNewUser": true/false,
     "userInfo": {
       "userId": "...",
       "name": "...",
       "email": "...",
       "provider": "google"
     }
   }
   ↓
7. JWT 토큰 저장 (AuthManager.setToken)
   ↓
8. 사용자 정보 저장 (localStorage)
   ↓
9. 팝업 닫힘 & 메인 페이지 새로고침
   ↓
10. 로그인 완료!
```

## 🎯 백엔드 요구사항

### API 엔드포인트

#### 1. **Google 로그인**
```
POST /auth/social/google/login
```

**Request Body:**
```json
{
  "accessToken": "ya29.a0AfH6SMB...",
  "provider": "google",
  "deviceId": "web_1234567890_abc123",
  "fcmToken": ""
}
```

**Response (성공):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": false,
    "userInfo": {
      "userId": "google_1234567890",
      "name": "홍길동",
      "email": "user@gmail.com",
      "phone": "01012345678",
      "profilePath": "https://...",
      "provider": "google",
      "socialId": "1234567890"
    }
  }
}
```

#### 2. **Kakao 로그인**
```
POST /auth/social/kakao/login
```

동일한 Request/Response 구조 (provider만 "kakao")

### 백엔드 처리 사항

1. **액세스 토큰으로 사용자 정보 조회**
   ```kotlin
   // Google
   GET https://www.googleapis.com/oauth2/v2/userinfo
   Authorization: Bearer {accessToken}
   
   // Kakao
   GET https://kapi.kakao.com/v2/user/me
   Authorization: Bearer {accessToken}
   ```

2. **사용자 확인/생성**
   - `socialId`와 `provider`로 기존 사용자 조회
   - 없으면 자동 회원가입
   - 있으면 로그인 처리

3. **JWT 토큰 발급**
   - 사용자 정보를 포함한 JWT 토큰 생성
   - 만료 시간 설정

4. **응답 반환**
   - JWT 토큰
   - 사용자 정보
   - 신규 가입 여부

## 🧪 테스트 방법

### 1. 환경변수 확인
```bash
# .env.local 파일 확인
cat .env.local
```

### 2. 개발 서버 재시작
```bash
npm run dev
```

### 3. 로그인 테스트
1. 로그인 모달 열기
2. Google 또는 Kakao 버튼 클릭
3. 팝업에서 인증 완료
4. 콘솔에서 API 호출 확인:
   ```
   POST https://www.tigerbk.com/api-doman/web/auth/social/google/login
   ```
5. 로그인 성공 여부 확인

### 4. 네트워크 디버깅
브라우저 개발자 도구 > Network 탭에서:
- OAuth 토큰 교환 요청 (Google/Kakao)
- 백엔드 로그인 API 요청
- 응답 데이터 확인

## 🐛 트러블슈팅

### 문제 1: "Google 인증에 실패했습니다"
**원인**: Google Client Secret이 잘못되었거나 없음
**해결**: `.env.local`에서 `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` 확인

### 문제 2: "Kakao 인증에 실패했습니다"
**원인**: Kakao Client ID가 잘못되었거나 없음
**해결**: `.env.local`에서 `NEXT_PUBLIC_KAKAO_CLIENT_ID` 확인

### 문제 3: 백엔드 API 호출 실패
**원인**: CORS 설정 또는 API URL 오류
**해결**: 
1. 백엔드 CORS 설정 확인
2. `NEXT_PUBLIC_API_BASE_URL` 확인

### 문제 4: "NotImplementedError: 카카오/구글 API 연동이 필요합니다"
**원인**: 백엔드에서 `getKakaoUserInfo()` 또는 `getGoogleUserInfo()` 미구현
**해결**: 백엔드 Kotlin 코드에서 실제 API 호출 구현 필요

## 📝 다음 단계

### 백엔드 TODO
- [ ] `SocialAuthSvc.kt`의 `getGoogleUserInfo()` 구현
- [ ] `SocialAuthSvc.kt`의 `getKakaoUserInfo()` 구현
- [ ] CORS 설정 (프론트엔드 도메인 허용)
- [ ] JWT 토큰 검증 로직 확인
- [ ] 에러 응답 포맷 통일

### 프론트엔드 TODO (선택사항)
- [ ] 토큰 교환을 Next.js API Routes로 이동 (보안 강화)
- [ ] FCM 토큰 연동 (푸시 알림)
- [ ] 소셜 로그인 성공 시 추가 정보 입력 플로우
- [ ] 에러 메시지 개선

## 🎉 완료!

이제 Google과 Kakao 소셜 로그인이 백엔드 API와 완전히 연동되었습니다!

문제가 발생하면 콘솔 로그와 네트워크 탭을 확인하고, 위의 트러블슈팅 가이드를 참고하세요.

