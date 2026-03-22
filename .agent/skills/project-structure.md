---
description: 프로젝트 구조 및 주요 디렉토리 설명
---

# Project Structure

## 디렉토리 구조
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── api/               # API 라우트 (백엔드 프록시)
│   ├── auth/              # 소셜 로그인 콜백 페이지
│   ├── quote-request/     # 견적 요청 페이지
│   └── ...
├── components/            # 재사용 컴포넌트
│   ├── Header.tsx         # 헤더 네비게이션
│   ├── LoginModal.tsx     # 로그인 모달
│   ├── RegisterModal.tsx  # 회원가입 모달
│   └── ...
├── services/              # API 서비스 레이어
│   ├── apiClient.ts       # API 클라이언트 (axios)
│   ├── socialAuthService.ts # 소셜 로그인 서비스
│   └── ...
├── providers/             # React Context Providers
│   └── AuthProvider.tsx   # 인증 상태 관리
├── types/                 # TypeScript 타입 정의
└── utils/                 # 유틸리티 함수
```

## 주요 설정 파일
- `next.config.ts`: Next.js 설정
- `tailwind.config.js`: Tailwind CSS 설정
- `.env.local`: 환경변수 (Git 제외)
