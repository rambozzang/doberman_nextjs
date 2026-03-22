---
description: Next.js 개발 서버 시작 및 빌드 방법
---

# Development Server

## 개발 서버 시작
```bash
// turbo
npm run dev
```
- 기본 포트: `http://localhost:3000`
- Turbopack 사용 (Next.js 16)

## 프로덕션 빌드
```bash
npm run build
npm run start
```

## 환경변수 설정
`.env.local` 파일에서 설정:
- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 주소
- 소셜 로그인 키 (SOCIAL_LOGIN_SETUP.md 참조)

## 주요 스크립트
- `start-server.sh`: 프로덕션 서버 시작
- `quick-restart.sh`: 빠른 재시작
- `health-check.sh`: 서버 상태 확인
