# 소셜 로그인 디버깅 가이드

## 현재 발생하는 오류들

### 1. COOP 경고 (무시 가능)
```
Cross-Origin-Opener-Policy policy would block the window.close call.
```
- **원인**: 브라우저의 Cross-Origin-Opener-Policy 보안 정책
- **영향**: 경고만 표시되고 실제 기능은 정상 작동
- **해결**: 콜백 페이지에서 자동으로 창을 닫으므로 문제없음

### 2. JSON 파싱 오류 (환경변수 문제)
```
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```
- **원인**: API 라우트가 HTML 에러 페이지를 반환
- **가능한 이유**:
  1. 환경변수가 설정되지 않음
  2. Next.js 서버가 재시작되지 않음
  3. API 라우트 경로 오류

## 해결 방법

### Step 1: 환경변수 확인

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Kakao OAuth 2.0
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key_here
```

### Step 2: 개발 서버 재시작

환경변수를 추가/수정한 후 **반드시** 개발 서버를 재시작:

```bash
# 현재 실행 중인 서버 중지 (Ctrl+C)
# 그리고 다시 시작
npm run dev
```

### Step 3: 환경변수 확인 방법

브라우저 콘솔에서 확인:

```javascript
// Google Client ID 확인
console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

// 또는 API 테스트
fetch('/api/auth/google/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'test' })
}).then(r => r.json()).then(console.log);
```

### Step 4: Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성/선택
3. "API 및 서비스" > "사용자 인증 정보"
4. "OAuth 클라이언트 ID" 생성
5. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:3001/auth/google/callback
   ```
6. 클라이언트 ID와 시크릿 복사하여 `.env.local`에 추가

### Step 5: Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. "플랫폼" > "Web 플랫폼 등록"
   ```
   http://localhost:3000
   http://localhost:3001
   ```
4. "카카오 로그인" 활성화
5. "Redirect URI" 설정:
   ```
   http://localhost:3000/auth/kakao/callback
   http://localhost:3001/auth/kakao/callback
   ```
6. REST API 키 복사하여 `.env.local`에 추가

## 테스트 체크리스트

- [ ] `.env.local` 파일이 프로젝트 루트에 존재
- [ ] 환경변수가 올바르게 설정됨
- [ ] 개발 서버를 재시작함
- [ ] Google Cloud Console에서 리디렉션 URI 설정
- [ ] Kakao Developers에서 리디렉션 URI 설정
- [ ] 팝업 차단이 해제됨
- [ ] 브라우저 콘솔에서 환경변수 확인

## 추가 디버깅

### API 라우트 직접 테스트

터미널에서 실행:

```bash
# Google Token API 테스트
curl -X POST http://localhost:3000/api/auth/google/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirectUri":"http://localhost:3000/auth/google/callback"}'

# 예상 응답 (환경변수 없는 경우):
# {"error":"Google OAuth 설정이 완료되지 않았습니다. 환경변수를 확인해주세요."}

# 예상 응답 (환경변수 있는 경우):
# {"error":"토큰 교환에 실패했습니다.","details":"..."}
```

### 로그 확인

서버 터미널에서 다음 로그 확인:

```
✓ Ready in 2.3s
○ Compiling /api/auth/google/token ...
✓ Compiled /api/auth/google/token in 123ms
POST /api/auth/google/token 200 in 456ms
```

## 문의

문제가 계속되면 다음 정보를 제공해주세요:

1. `.env.local` 파일 존재 여부
2. 개발 서버 재시작 여부
3. 브라우저 콘솔의 전체 에러 메시지
4. 서버 터미널의 로그
