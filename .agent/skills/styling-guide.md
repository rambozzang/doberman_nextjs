---
description: UI 컴포넌트 스타일링 및 디자인 가이드라인
---

# Styling Guide

## 기술 스택
- **Tailwind CSS**: 유틸리티 클래스 기반 스타일링
- **Framer Motion**: 애니메이션 효과

## 디자인 테마
- 다크 모드 기반 (`slate-900` 배경)
- 그라데이션: `from-blue-500 to-purple-600`
- 글래스모피즘: `backdrop-blur-xl bg-white/5 border-white/10`

## 반응형 브레이크포인트
```css
sm: 640px   /* 모바일 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 화면 */
```

## 공통 클래스 패턴
```tsx
// 카드 컴포넌트
"bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"

// 버튼 (Primary)
"bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"

// 입력 필드
"bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400"
```

## 설정 파일
- `tailwind.config.js`: Tailwind 커스텀 설정
