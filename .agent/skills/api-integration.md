---
description: API 클라이언트 사용법 및 백엔드 연동 방법
---

# API Integration

## API Client 사용법
```typescript
import { ApiClient } from '@/services/apiClient';

// GET 요청
const response = await ApiClient.get<ResponseType>('/endpoint');

// POST 요청
const response = await ApiClient.post<ResponseType>('/endpoint', data);
```

## 환경변수
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

## 인증 헤더
- `ApiClient`는 자동으로 JWT 토큰을 `Authorization` 헤더에 포함
- `AuthManager.getToken()`으로 현재 토큰 확인

## 주요 API 엔드포인트
- `/auth/login`: 일반 로그인
- `/auth/register`: 회원가입
- `/auth/social/[provider]/login`: 소셜 로그인
- `/customer-request/*`: 견적 요청 관련

## 상세 문서
- `API_USAGE.md`: API 사용법
- `BACKEND_INTEGRATION.md`: 백엔드 연동 가이드
