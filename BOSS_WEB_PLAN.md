# 도배사장님 웹 (Boss Web) 개발 기획서

> 작성일: 2026-04-07
> 대상: `https://www.doberman.kr/boss`
> 목표: 기존 Next.js 고객용(`/`)과 동일한 코드베이스에 사장님(도배 전문가)용 웹을 추가하고, Flutter 앱의 모든 기능을 웹에서도 제공한다.

---

## 0. 배경

| 항목 | 현재 상태 |
|---|---|
| 고객 채널 | Next.js (`https://www.doberman.kr`), `userType='WEB'` |
| 사장님 채널 | Flutter 앱 (`doberman` Flutter 프로젝트), `userType='APP'` |
| 채팅 백엔드 | FastAPI + WebSocket, Oracle Cloud `/vdata/python/chat_system`, 포트 9988, `root_path=/chat-api` |
| 본 백엔드 | 별도 Spring/PHP API (`UrlConfig.baseURL`) |
| 인증 | JWT HS512 (base64 시크릿), 7일 만료, payload `{sub, user_type, exp}` |

본 작업은 사장님 전용 Flutter 앱의 모든 기능을 동일한 Next.js 코드베이스 안에 `/boss` URL prefix로 추가하는 것이 목적이다. 두 사용자 컨텍스트(WEB / APP)는 한 도메인 안에서 명확히 분리된 상태로 공존해야 한다.

---

## 1. 채팅 백엔드 분석 결과 요약

(`/vdata/python/chat_system` SSH 분석 결과)

### 1.1 구성
- **FastAPI** 754줄 `main.py`, REST + WebSocket 통합
- **Uvicorn** 9988 포트, `--root-path /chat-api`
- **DB**: MySQL, SQLAlchemy (`QueuePool size=20, overflow=30, recycle=3600s`)
- **JWT**: HS512, base64-encoded secret, 7일 만료
- **CORS**: `https://www.tigerbk.com`, `tigerbk.com`, `localhost:3000/3001` 만 허용 → **`doberman.kr` 추가 필요**

### 1.2 주요 엔드포인트
| 종류 | 경로 |
|---|---|
| REST | `/chat/list`, `/chat/room/{roomId}/messages`, `/chat/room`, `/chat/room/{requestId}`, `/chat/upload`, `/user/status`, `/chat/messages/read`, `/auth/login` |
| WebSocket | `/ws/room/{room_id}`, `/ws/rooms`, `/ws/app-status` |
| Admin | `/admin/*` |

### 1.3 사용자 타입
- `WEB` → 웹 고객 (Next.js 현재 채널, `TB_WEB_CUSTOMER`)
- `APP` → 도배 사장님 (Flutter 현재 채널, `TB_USER`)
- **신규 boss web도 `userType='APP'`을 그대로 사용** (DB 사용자는 동일하므로 채팅 라우팅, presence, room 매칭이 그대로 작동)

### 1.4 발견된 이슈
| 심각도 | 항목 | 위치 |
|---|---|---|
| HIGH-1 | `/auth/login`이 비밀번호 검증 없이 JWT 발급 | `main.py /auth/login` |
| HIGH-2 | CORS 화이트리스트에 운영 도메인(`doberman.kr`) 누락 | `main.py CORS` |
| HIGH-3 | `get_chat_rooms_by_user`에 사용되지 않는 최적화 서브쿼리 + 실제 N+1 루프 공존 | `crud.py` |
| HIGH-4 | `JWT_SECRET_KEY = base64.b64encode(...)` (이미 시크릿을 매번 새로 base64 인코딩) | `auth.py` |
| HIGH-5 | `room_websocket.py` line 320, 387에서 한국어 ensure_ascii 우회되지 않은 raw `ws.send_json` | `chat_websockets/room_websocket.py` |
| MED | 업로드 화이트리스트는 있으나 MIME 검증 없음 | `utils.py` |
| MED | `connectedClients` / `roomListSubscribers` 등 in-memory 상태 → 멀티 워커 시 동기화 불가 | `chat_websockets/__init__.py` |
| LOW | 로그 회전 미설정 | `utils.py` |

→ 사장님 웹 작업과 별개로, **HIGH-1, HIGH-2는 1차 출시 전 반드시 패치** 필요. 패치 않으면 사장님 웹이 사용자 비밀번호 없이 토큰을 받을 수 있고, 운영 도메인에서 CORS 차단되어 채팅 자체가 동작하지 않는다.

---

## 2. Flutter 앱 기능 인벤토리 (이식 대상)

`lib/app/` 하위 구조 기반. 모든 기능은 사장님 웹에서도 동일하게 제공해야 한다.

### 2.1 인증/온보딩
| Flutter 페이지 | 설명 | 웹 라우트 (제안) |
|---|---|---|
| `login/login_page.dart` | 사장님 로그인 | `/boss/login` |
| `login/signup_page.dart` | 회원가입 | `/boss/signup` |
| `login/find_id_page.dart` | 아이디 찾기 | `/boss/find-id` |
| `login/find_password_page.dart` | 비밀번호 찾기 | `/boss/find-password` |
| `login/phone_auth_page.dart` | 휴대폰 인증 | `/boss/phone-auth` |
| `login/agree_page.dart` | 약관동의 | `/boss/agree` |
| `login/permission_page.dart` | 권한안내 (웹은 푸시 권한만) | `/boss/permission` |
| `auth/auth_page.dart` | 진입 라우터 | `/boss` (entry) |
| `alert/company_registration_page.dart` | 사업자 정보 등록 | `/boss/onboarding/company` |

### 2.2 홈 / 메인
| Flutter | 웹 라우트 |
|---|---|
| `main/main_page.dart` | `/boss` (홈, 대시보드) |
| `home/home_page.dart` | `/boss/home` (통계 위젯) |
| `home/statistics_detail_page.dart` | `/boss/statistics` |

### 2.3 견적 관리 (사장님 핵심)
| Flutter | 웹 라우트 |
|---|---|
| `web/web_request_list_page.dart` | `/boss/requests` (전체 견적요청 목록) |
| `web/web_request_mylist_page.dart` | `/boss/requests/my` (내가 답변한 목록) |
| `web/web_request_detail_page.dart` | `/boss/requests/[id]` |
| `web/web_request_answer_page.dart` | `/boss/requests/[id]/answer` |
| `web/web_template_manage_page.dart` | `/boss/templates` (답변 템플릿) |

### 2.4 채팅
| Flutter | 웹 라우트 |
|---|---|
| `web/web_chat_list_page.dart` | `/boss/chat` (채팅방 목록) |
| `web/web_chat_detail_page.dart` | `/boss/chat/[roomId]` |

→ 기존 `src/components/chat/*`, `src/hooks/useChat*` 자산을 **재사용**하되, `useChatAuth.ts`의 `userType = "WEB"` 하드코딩을 컨텍스트에 따라 `"APP"`으로 분기.

### 2.5 일정 / 캘린더
| Flutter | 웹 라우트 |
|---|---|
| `table_calendar/table_calendar_page.dart` | `/boss/calendar` |
| `table_calendar/week_view_top_page.dart` | `/boss/calendar/week` |
| `table_calendar/day_view_page.dart` | `/boss/calendar/day` |
| `table_calendar/alram_page.dart` | `/boss/calendar/alarm` |
| `table_calendar/timer_selector_page.dart`, `month_selector_page.dart` | (모달 컴포넌트로 흡수) |

### 2.6 시공기록
| Flutter | 웹 라우트 |
|---|---|
| `construction_record/construction_record_list_page.dart` | `/boss/construction` |
| `construction_record/construction_record_add_page.dart` | `/boss/construction/new` |
| `construction_record/construction_record_detail_page.dart` | `/boss/construction/[id]` |

### 2.7 AS 요청
| Flutter | 웹 라우트 |
|---|---|
| `as_request/as_request_list_page.dart` | `/boss/as` |
| `as_request/as_request_add_page.dart` | `/boss/as/new` |
| `as_request/as_request_detail_page.dart` | `/boss/as/[id]` |

### 2.8 포트폴리오
| Flutter | 웹 라우트 |
|---|---|
| `portfolio/portfolio_list_page.dart` | `/boss/portfolio` |
| `portfolio/portfolio_add_page.dart` | `/boss/portfolio/new` |
| `portfolio/portfolio_detail_page.dart` | `/boss/portfolio/[id]` |

### 2.9 견적서 / 영수증
| Flutter | 웹 라우트 |
|---|---|
| `estimate/estimate_page.dart` | `/boss/estimate` |
| `estimate/pdf/estimate_print_page.dart` | `/boss/estimate/[id]/print` |
| `estimate/pdf/receipt_print_page.dart` | `/boss/estimate/[id]/receipt` |

→ Flutter `pdf` + `printing` 패키지 → 웹에서는 `react-pdf` 또는 서버사이드 PDF 생성 (`@react-pdf/renderer`).

### 2.10 체크리스트
| Flutter | 웹 라우트 |
|---|---|
| `check_list/check_lilst_page.dart` | `/boss/checklist` |
| `check_list/check_add_page.dart` | `/boss/checklist/new` |
| `check_list/checklist_print_page.dart` | `/boss/checklist/[id]/print` |

### 2.11 게시판 (사장님 커뮤니티)
| Flutter | 웹 라우트 |
|---|---|
| `bbs/bbs_list_page.dart` | `/boss/community` |
| `bbs/bbs_view_page.dart` | `/boss/community/[id]` |
| `bbs/bbs_write_page.dart` | `/boss/community/new` |
| `bbs/bbs_modify_page.dart` | `/boss/community/[id]/edit` |
| `bbs/bbs_my_list_page.dart` | `/boss/community/my` |
| `bbs/bbs_block_list_page.dart` | `/boss/community/blocks` |
| `bbs/bbs_sigo_page.dart` | `/boss/community/[id]/report` |
| `bbs/comments/*` | (상세 페이지의 컴포넌트) |

### 2.12 결제 / 구독
| Flutter | 웹 라우트 |
|---|---|
| `payments/views/subscription_page.dart` | `/boss/billing/plans` |
| `payments/views/subscription_status_page.dart` | `/boss/billing/status` |
| `payments/views/subscription_renewal_history_page.dart` | `/boss/billing/renewals` |
| `payments/purchase_history_page.dart` | `/boss/billing/history` |

→ Flutter는 IAP, **웹은 PG (이니시스/토스/카카오페이)** 로 별도 구현. 백엔드 결제 ID 매핑 정책 합의 필요.

### 2.13 매출 / 주문
| Flutter | 웹 라우트 |
|---|---|
| `order/order_list_page.dart` | `/boss/orders` |
| `order/quick_order_page.dart` | `/boss/orders/quick` |
| `order/real_time_sales_page.dart` | `/boss/sales/realtime` |
| `sales/sales_status_page.dart` | `/boss/sales` |

### 2.14 전자서명
| Flutter | 웹 라우트 |
|---|---|
| `signature/signature_list_page.dart` | `/boss/signatures` |
| `signature/signature_capture_page.dart` | `/boss/signatures/capture` |
| `signature/signature_detail_page.dart` | `/boss/signatures/[id]` |

→ Flutter는 터치 캔버스, 웹은 `<canvas>` + Pointer Events 또는 `react-signature-canvas`.

### 2.15 사진 / 카메라
| Flutter | 웹 라우트 |
|---|---|
| `image/simple_camera_page.dart` | `/boss/photo/camera` (`navigator.mediaDevices.getUserMedia`) |
| `image/image_picker_page.dart` | `<input type=file>` 컴포넌트로 흡수 |
| `image/image_edit_page.dart` | `/boss/photo/edit` (Cropper.js 등) |
| `image/image_one_view_page.dart` | 모달 컴포넌트 |

### 2.16 내 정보 / 회사
| Flutter | 웹 라우트 |
|---|---|
| `myinfo/myinfo_page.dart` | `/boss/me` |
| `myinfo/myinfo_modify_page.dart` | `/boss/me/edit` |
| `myinfo/myCompany_view_page.dart` | `/boss/me/company` |
| `myinfo/myCompany_add_page.dart` | `/boss/me/company/new` |

### 2.17 설정 / 약관 / 알림
| Flutter | 웹 라우트 |
|---|---|
| `setting/setting_page.dart` | `/boss/settings` |
| `setting/alram_setting_page.dart` | `/boss/settings/notifications` |
| `setting/noti_page.dart` | `/boss/notifications` |
| `setting/noti_view_page.dart` | `/boss/notifications/[id]` |
| `setting/faq_page.dart` | `/boss/help/faq` |
| `setting/service_page.dart` | `/boss/help/terms` |
| `setting/privecy_page.dart` | `/boss/help/privacy` |
| `setting/maketing_page.dart` | `/boss/help/marketing` |

### 2.18 기타
| Flutter | 웹 라우트 |
|---|---|
| `event/coffee_coupon_event_page.dart` | `/boss/events/coffee` |
| `alert/update_page.dart` | (웹은 자동 배포로 불필요) |
| `alert/ad_page.dart` | (홈 배너 컴포넌트로 흡수) |
| `customer/order_info_card_page.dart` | (주문 카드 컴포넌트) |

---

## 3. Repository 매핑 (Flutter `lib/repo/` → Next.js `src/lib/api/`)

| Flutter Repo | 책임 | Next.js 위치 (제안) |
|---|---|---|
| `web/web_repo.dart` | 사장님 견적/채팅 REST | `src/lib/api/boss/requests.ts`, `src/lib/api/boss/chat.ts` |
| `login_repo.dart` | 로그인/회원가입 | `src/lib/api/auth.ts` (boss 분기 추가) |
| `user_repo.dart` | 사용자 프로필 | `src/lib/api/user.ts` |
| `company_repo.dart` | 사업자 정보 | `src/lib/api/company.ts` |
| `estimate_repo.dart` | 견적서 CRUD | `src/lib/api/boss/estimate.ts` |
| `calendar/calendar_repo.dart` | 일정 | `src/lib/api/boss/calendar.ts` |
| `construction_record_repo.dart` | 시공기록 | `src/lib/api/boss/construction.ts` |
| `as_request_repo.dart` | AS | `src/lib/api/boss/as.ts` |
| `portfolio_repo.dart` | 포트폴리오 | `src/lib/api/boss/portfolio.ts` |
| `signature_repo.dart` | 전자서명 | `src/lib/api/boss/signature.ts` |
| `checklist_repo.dart` | 체크리스트 | `src/lib/api/boss/checklist.ts` |
| `bbs/bbs_repo.dart`, `comment_repo.dart` | 게시판 | `src/lib/api/boss/community.ts` |
| `order_repo.dart` | 주문 | `src/lib/api/boss/orders.ts` |
| `statis_repo.dart` | 통계 | `src/lib/api/boss/stats.ts` |
| `image_repo.dart`, `cloudflare_repo.dart` | 이미지 업로드 | `src/lib/api/upload.ts` |
| `customer_repo.dart` | 고객정보 | `src/lib/api/boss/customers.ts` |
| `web_template_repo.dart` | 답변 템플릿 | `src/lib/api/boss/templates.ts` |
| `common/comm_repo.dart` | 공통 | `src/lib/api/common.ts` |

---

## 4. 디렉터리 구조 (Next.js, App Router)

```
src/
  app/
    (web)/                    # 기존 고객용 라우트 그룹
      layout.tsx              # 고객 레이아웃
      page.tsx
      ...
    boss/                     # 사장님 라우트 prefix
      layout.tsx              # BossLayout (헤더/사이드바/푸터 분리)
      page.tsx                # 대시보드
      login/page.tsx
      signup/page.tsx
      requests/
        page.tsx
        my/page.tsx
        [id]/page.tsx
        [id]/answer/page.tsx
      chat/
        page.tsx
        [roomId]/page.tsx
      calendar/
      construction/
      as/
      portfolio/
      estimate/
      checklist/
      community/
      billing/
      orders/
      sales/
      signatures/
      photo/
      me/
      settings/
      notifications/
      help/
      events/
      onboarding/
  components/
    chat/                     # 기존 (재사용, 컨텍스트 인지)
    boss/                     # 사장님 전용 컴포넌트
      layout/BossHeader.tsx
      layout/BossSidebar.tsx
      requests/RequestCard.tsx
      requests/AnswerForm.tsx
      calendar/MonthView.tsx
      calendar/WeekView.tsx
      construction/RecordForm.tsx
      ...
    shared/                   # 양 컨텍스트 공용
  contexts/
    UserContext.tsx           # role: 'web' | 'boss' (= userType WEB | APP)
  hooks/
    useChatAuth.ts            # userType 분기 추가
    useBossAuth.ts            # 신규 (사장님 전용 토큰 관리)
  lib/
    api/
      auth.ts
      boss/
        requests.ts
        chat.ts
        estimate.ts
        ...
      common.ts
    chatApi.ts                # 기존
    chatWebSocket.ts          # 기존 (재사용)
    auth.ts                   # 기존 (web 고객용)
    bossAuth.ts               # 신규 (사장님 전용 storage 키)
  store/
    boss/                     # Zustand store 사장님용
```

### 4.1 토큰 분리 정책
같은 브라우저에서 고객/사장님 동시 로그인 시나리오는 거의 없으나, 안전을 위해 storage key 분리:
- 고객: `localStorage.token` (기존)
- 사장님: `localStorage.boss_token`
- `useChatAuth`는 현재 라우트가 `/boss/*` 인지 `UserContext` 보고 `userType` 결정.

---

## 5. 인증 / 권한 흐름

```
[방문자] /boss 진입
  ↓
boss layout: useBossAuth() → boss_token 검증
  ↓ 미로그인
/boss/login 으로 redirect
  ↓ 로그인 성공
- 본 백엔드(POST /boss/login)에서 사장님 사용자 검증
- 채팅용 JWT는 chat-api `/auth/login` 또는 본 백엔드에서 동시 발급
- localStorage.boss_token = jwt
- UserContext.role = 'boss', userType='APP'
  ↓
대시보드 / 견적 / 채팅 등 전 기능 접근
```

**주의**: 채팅 백엔드 HIGH-1(비번 검증 없음)이 그대로면 boss_token을 제3자가 위조 가능. 1차 출시 전 반드시 chat-api `/auth/login`에 본 백엔드 위임 검증 또는 비번 검증 추가.

---

## 6. 상태관리 / 데이터 페칭

| 영역 | 도구 |
|---|---|
| 서버 상태 | React Query (`@tanstack/react-query`) — 견적, 채팅 메시지, 게시판 등 모든 GET |
| 클라이언트 상태 | Zustand — 로그인 사용자, 모달, 채팅 UI 상태 |
| WebSocket 메시지 | 기존 `useChatWebSocket` 재사용, 사장님 전용 room list / app-status hook은 신규 |
| Form | React Hook Form + Zod 검증 |
| PDF 출력 | `@react-pdf/renderer` (서버 렌더 가능) |
| 캘린더 | `react-big-calendar` 또는 `@fullcalendar/react` |
| 이미지 크롭 | `react-easy-crop` |
| 시그니처 | `react-signature-canvas` |
| 카메라 | `navigator.mediaDevices.getUserMedia` 직접 |
| 결제 | 토스페이먼츠 SDK (또는 이니시스 웹SDK) |
| 푸시 | Firebase Web Push (`firebase/messaging`) |

---

## 7. 단계별 실행 로드맵

### Phase 0 — 백엔드 사전 패치 (1차 출시 차단 항목)
1. chat-api `main.py`: CORS 화이트리스트에 `https://www.doberman.kr`, `https://doberman.kr` 추가 (HIGH-2)
2. chat-api `/auth/login`: 비밀번호 검증 또는 본 서버 위임 검증 추가 (HIGH-1)
3. chat-api `auth.py`: `JWT_SECRET_KEY` 이중 base64 인코딩 정리 (HIGH-4)
4. chat-api `room_websocket.py:320, 387`: raw `ws.send_json` → `send_json_with_korean` 교체 (HIGH-5)
5. chat-api `crud.py`: dead 서브쿼리 코드 제거, last_messages N+1 → JOIN/IN 한 번에 (HIGH-3)

### Phase 1 — 골격 (1주차)
- `src/app/boss/layout.tsx`, `BossHeader`, `BossSidebar`
- `UserContext` 분기 (web/boss)
- `useBossAuth`, `bossAuth.ts`
- `/boss/login`, `/boss/signup` 등 인증 페이지
- `useChatAuth`의 userType 분기

### Phase 2 — 핵심 비즈니스 (견적 + 채팅) (2~3주차)
- `/boss` 대시보드 (간단 위젯)
- `/boss/requests` 목록 + 무한스크롤
- `/boss/requests/[id]` 상세
- `/boss/requests/[id]/answer` 답변 작성 (템플릿 사용)
- `/boss/requests/my` 내 답변
- `/boss/templates` 템플릿 관리
- `/boss/chat` 목록 (`/ws/rooms` 구독)
- `/boss/chat/[roomId]` (`/ws/room/{id}` 구독, 기존 컴포넌트 재사용)

### Phase 3 — 일정/현장 운영 (4~5주차)
- `/boss/calendar` (월/주/일 뷰)
- `/boss/construction` 시공기록
- `/boss/as` AS 요청
- `/boss/photo/*` 이미지 업로드/카메라

### Phase 4 — 견적서/문서 (6주차)
- `/boss/estimate` 견적서 작성
- `/boss/estimate/[id]/print`, `[id]/receipt` PDF (4가지 스타일)
- `/boss/checklist` 체크리스트 + 인쇄
- `/boss/signatures` 전자서명 (`react-signature-canvas`)

### Phase 5 — 영업/매출 (7주차)
- `/boss/sales`, `/boss/sales/realtime`
- `/boss/orders`, `/boss/orders/quick`
- `/boss/statistics`
- `/boss/portfolio`

### Phase 6 — 커뮤니티/회사정보 (8주차)
- `/boss/community/*` (게시판/댓글/신고/차단)
- `/boss/me/*`
- `/boss/onboarding/company`

### Phase 7 — 결제/알림/설정 (9주차)
- `/boss/billing/*` (PG 연동)
- `/boss/notifications`, Web Push 등록
- `/boss/settings/*`, `/boss/help/*`
- `/boss/events/coffee`

### Phase 8 — QA / 폴리싱 / 모바일 반응형 (10주차)
- 모바일 뷰포트 검증 (사장님은 현장에서 모바일 사용 가능성 높음)
- 접근성/i18n 확인
- 부하/동시접속 테스트 (특히 채팅)
- 비밀번호/CSRF/XSS 점검

---

## 8. 기존 코드 재사용/수정 포인트

| 파일 | 작업 |
|---|---|
| `src/hooks/useChatAuth.ts` | `userType = "WEB"` 하드코딩 → `UserContext.role`에서 결정 |
| `src/components/chat/useChatLogic.ts` | boss 컨텍스트에서도 그대로 작동하도록 chatPartner 매핑만 분기 |
| `src/lib/chatApi.ts` | 토큰 가져오기 함수가 `localStorage.token` → `useUser().token` 로 위임 |
| `src/lib/auth.ts` | 고객 전용으로 유지, `bossAuth.ts` 신규 |
| `src/app/layout.tsx` | UserProvider 추가 |
| (신규) `src/app/boss/layout.tsx` | BossUserProvider, BossHeader/Sidebar |

---

## 9. 운영/배포 고려사항

- **단일 도메인, 단일 배포**: 한 Next.js 앱이 두 컨텍스트 모두 서비스. CDN/캐시 전략은 그룹별로 다르게.
- **SEO**: `/boss/*`는 noindex (사장님 전용)
- **로깅**: 사장님 액션은 별도 라벨(`role=boss`)로 백엔드 로그에 마킹
- **푸시 알림**: 웹 FCM 토큰을 본 백엔드에 등록 (Flutter와 별개의 token store)
- **세션 만료 정책**: 사장님은 현장에서 장시간 세션 필요 → JWT refresh 또는 7일 만료 그대로

---

## 10. 위험 / 미해결 이슈

1. **결제**: 웹 PG 연동 정책(이니시스/토스/카카오) 미정 → 백엔드와 결제 ID 매핑 합의 필요
2. **푸시**: Web Push와 Flutter FCM 토큰을 같은 사용자 키로 관리할지 분리할지 결정 필요
3. **카메라/사진**: 데스크톱에서는 카메라 미사용, 파일 업로드만 지원할지 결정
4. **chat-api 보안 패치**: Phase 0가 늦어지면 1차 출시 불가
5. **데이터 모델 확인**: Flutter repo의 일부 API(견적/체크리스트/포트폴리오 등) 본 백엔드 스펙 문서 부재 → 각 Phase 시작 시 API 명세 확인 필요
6. **모바일 사용성**: 사장님 사용자는 PC와 모바일 혼용 → 모바일 우선 디자인 권장
7. **두 채널의 권한 충돌**: 같은 브라우저에서 고객/사장님 동시 로그인 가능성 — storage key 분리로 해결되지만 UI에서 명확히 구분 표시 필요

---

## 11. 다음 작업 (Immediate Next Steps)

1. **본 기획서 사용자 리뷰** → 라우트 구조, 디렉터리 구조, Phase 순서 확정
2. **Phase 0 백엔드 패치** 진행 (chat-api 보안/CORS)
3. **본 백엔드(API) 사장님 엔드포인트 명세 수집** — Flutter `repo/*.dart` 코드 기준으로 OpenAPI 또는 표 형식 정리
4. **Phase 1 골격 PR** — `/boss/layout.tsx`, `useBossAuth`, 로그인 페이지

---

## 부록 A — 사장님 웹이 필요로 하는 chat-api 변경 요약

```
# main.py CORS
allow_origins=[
    "https://www.tigerbk.com",
    "https://tigerbk.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://www.doberman.kr",   # 추가
    "https://doberman.kr",       # 추가
]

# main.py /auth/login — 본 백엔드 위임 검증 추가 필요
# auth.py — JWT_SECRET 이중 base64 정리
# room_websocket.py:320,387 — send_json_with_korean 교체
# crud.py get_chat_rooms_by_user — N+1 제거
```

## 부록 B — Flutter 페이지 ↔ Next.js 라우트 대응표 (요약)

| Flutter Page | Next.js Route |
|---|---|
| auth_page | /boss |
| login_page | /boss/login |
| signup_page | /boss/signup |
| find_id/password/phone_auth/agree/permission | /boss/find-id, /find-password, /phone-auth, /agree, /permission |
| main_page / home_page | /boss, /boss/home |
| statistics_detail | /boss/statistics |
| web_request_list | /boss/requests |
| web_request_mylist | /boss/requests/my |
| web_request_detail | /boss/requests/[id] |
| web_request_answer | /boss/requests/[id]/answer |
| web_template_manage | /boss/templates |
| web_chat_list | /boss/chat |
| web_chat_detail | /boss/chat/[roomId] |
| table_calendar / week_view / day_view / alram | /boss/calendar/* |
| construction_record_* | /boss/construction/* |
| as_request_* | /boss/as/* |
| portfolio_* | /boss/portfolio/* |
| estimate / pdf prints | /boss/estimate/* |
| check_list / check_add / checklist_print | /boss/checklist/* |
| bbs_* / comments | /boss/community/* |
| subscription / status / renewals / purchase_history | /boss/billing/* |
| order_list / quick_order / real_time_sales / sales_status | /boss/orders/*, /boss/sales/* |
| signature_* | /boss/signatures/* |
| simple_camera / image_picker / image_edit / image_one_view | /boss/photo/* |
| myinfo / myinfo_modify / myCompany_view / myCompany_add | /boss/me/* |
| setting / alram_setting / faq / service / privecy / maketing | /boss/settings/*, /boss/help/* |
| noti / noti_view | /boss/notifications/* |
| coffee_coupon_event | /boss/events/coffee |
| company_registration | /boss/onboarding/company |

---

(끝)
