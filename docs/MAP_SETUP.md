# 전국 도배업체 지도(/map) 설정 가이드

작성일: 2026-07-28

## 1. 필요한 키 2개

### 1-1. 네이버 지도
NAVER Cloud Platform → **Maps → Web Dynamic Map** 에서 발급.
**네이버 로그인 API 키(`NEXT_PUBLIC_NAVER_CLIENT_ID`)와 다른 키다.**

웹은 모바일 앱과 같은 공개 클라이언트 ID(`1xvp7vju2q`)를 기본값으로 사용한다.
이 값은 지도 SDK 요청에 노출되는 공개 식별자이며, NCP의 Web 서비스 URL 제한으로 보호한다.
별도 Maps 애플리케이션을 쓰는 환경에서만 `web/.env.local` 로 덮어쓴다:
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_키
# 신규 콘솔 키는 ncpKeyId(기본값). 구 콘솔 키라면 아래를 ncpClientId 로 지정
# NEXT_PUBLIC_NAVER_MAP_AUTH_PARAM=ncpClientId
```

NCP 애플리케이션의 **Web 서비스 URL** 에 `https://www.doberman.kr` 과
`http://localhost:3000` 을 등록해야 한다.
등록하지 않으면 인증 실패로 지도가 뜨지 않는다.

### 1-2. 공공데이터포털 (업체 데이터)
[소상공인시장진흥공단_상가(상권)정보](https://www.data.go.kr/data/15083033/fileData.do) —
**이용허락범위 제한 없음**이라 저장·지도표시가 가능하다. CSV 다운로드만 하면 되므로
API 키 없이도 진행할 수 있다(오픈API를 쓸 경우에만 인증키 필요).

> 네이버 지역검색 API 는 쓰지 않는다. `display` 최대 5건·`start` 1 제한으로 전국 업체를
> 열거할 수 없고, 검색 결과 저장에도 약관 제약이 있다.

## 2. 업체 데이터 적재

```bash
# 서버(oracle)에서 실행. 분기 1회면 충분하다.
cd /vdata/python
# 1) 먼저 건수만 확인 (DB 에 쓰지 않음)
python3 -m vendor.sbiz_import --csv /path/소상공인시장진흥공단_상가정보_YYYYMM.csv --dry-run
# 2) 실제 적재
python3 -m vendor.sbiz_import --csv /path/....csv
```

`python/.env` 에 DB 접속 정보가 필요하다.
```
VENDOR_DB_HOST=127.0.0.1
VENDOR_DB_PORT=33066
VENDOR_DB_USER=db_doberman
VENDOR_DB_PASSWORD=...
VENDOR_DB_NAME=doberman
```

적재는 `(SOURCE, SOURCE_KEY)` 유니크 인덱스 기준 upsert 라 여러 번 돌려도 안전하다.

### 업종 필터 기준
`vendor/classify_vendor.py` — 정밀도 우선.
- 채택: 상호명/업종명에 `도배`, `벽지`, `지물포`, `표구` / 업종분류에 `실내장식`, `내장목공`
- **제외: `인테리어` 만 있는 경우** (가구·조명·설계까지 섞여 오탐이 크다)
- 제외: `벽지제조`, `벽지도매`, `학원`
- 제외: 좌표가 국내 범위(위 33~39, 경 124~132) 밖이거나 0

기준을 바꾸려면 이 파일만 고치면 되고, `tests/test_classify_vendor.py` 로 검증한다.

## 3. 백엔드

`sql/2026-07-28-vendor-map.sql` — `TB_VENDOR` 생성. **이미 운영 DB 에 적용 완료.**

공개 API (비로그인, `SecurityConfig` permitAll `/web/vendor/**`)
| 엔드포인트 | 용도 |
|---|---|
| `POST /web/vendor/map` | 지도 영역(bbox) 내 업체. 광고>회원사 순, 최대 500건 |
| `GET /web/vendor/clusters` | 시군구 단위 집계 (지도 축소 상태 버블) |
| `GET /web/vendor/{id}` | 업체 상세 (좌측 패널) |

전국을 개별 마커로 그리면 수만 개가 되어 브라우저가 멈추므로, 줌 11 미만에서는
시군구 집계 버블만 그린다(`MARKER_ZOOM`).

## 4. 견적 연동

우측 패널은 기존 견적 요청 API 를 **그대로** 호출한다. 별도 테이블을 만들지 않았다.
- 비로그인: `POST /web/customer-request/non-login` (`webCustomerId: 0`)
- 로그인: `POST /web/customer-request`

지정 업체는 `etc1` 에 `지정업체: {업체명} (vendorId={id})`, 유입 경로는 `etc2 = "지도(/map)"`
로 담아 보내므로 스키마 변경 없이 사장님 화면에서 확인할 수 있다.
라벨 값(건물유형·벽지종류 등)은 `/quote-request` 와 동일하게 맞췄다 — 사장님 대시보드에서
같은 기준으로 필터되어야 하므로 임의 문구를 쓰면 안 된다.

## 5. SNS/플랫폼 링크

인스타그램·틱톡·유튜브·당근·숨고·크몽. **수집된 실제 계정이 있으면 그것을, 없으면 검색으로**
대체한다. 좌측 패널에서 체크 표시가 있는 것이 수집된 실제 계정이다.

### 수집 방법 (`python/vendor/link_resolver.py`)
각 SNS 를 직접 스크래핑하지 않는다. 약관 위반이고 차단 위험이 크며, 상호명만으로
계정을 자동 매칭하면 동명 업체 오탐이 심하다. 대신 공식 경로 세 가지만 쓴다.

| 출처 | 방법 | 신뢰도 |
|---|---|---|
| `HOMEPAGE` | 업체가 자기 홈페이지에 걸어둔 링크를 읽는다 | 업체 본인이 건 링크라 오탐 없음 (`VERIFIED_YN='Y'`) |
| `YOUTUBE_API` | YouTube Data API v3 공식 검색 | 채널명이 업체명과 겹칠 때만 채택 (`VERIFIED_YN='N'`) |
| `NAVER_API` | 네이버 블로그 검색 API | 블로그명·제목에 업체명이 겹칠 때만 채택 (`VERIFIED_YN='N'`) |

**네이버 블로그가 가장 중요하다.** 회원사 중 홈페이지가 있는 3곳이 전부 네이버
블로그였다. 다만 기존 네이버 앱은 로그인 전용이라 검색 스코프가 꺼져 있다
(401 `Scopes are Empty`). developers.naver.com 앱에서 **'검색' API 를 추가**하고
`python/.env` 에 아래를 넣으면 136곳 전체를 자동 수집할 수 있다.
```
NAVER_SEARCH_CLIENT_ID=...
NAVER_SEARCH_CLIENT_SECRET=...
```

```bash
cd /vdata/python
python3 -m vendor.link_resolver --dry-run --limit 20      # 결과만 확인
python3 -m vendor.link_resolver --limit 200               # 홈페이지 수집
python3 -m vendor.link_resolver --limit 200 --youtube --naverblog  # 공식 검색 API 도 함께
```

YouTube 를 쓰려면 `python/.env` 에 `YOUTUBE_API_KEY=...` (Google Cloud → YouTube Data API v3).
없으면 자동으로 건너뛴다.

인스타/틱톡/당근/숨고/크몽은 공개 검색 API 가 없어 홈페이지 경유로만 수집된다.
수집 안 된 플랫폼은 프런트가 검색 딥링크로 대체 표시한다.
검색 URL 패턴 중 `daangn`·`soomgo`·`kmong` 은 실제 확인이 안 돼 `verified: false` 로
표시했다 — `src/app/map/socialLinks.ts` 한 곳만 고치면 된다.

## 6. 이야기(커뮤니티)

좌측 패널 "이야기" 탭. 업체를 선택하면 그 업체 게시판, 선택 안 하면 전체 광장이다.

기존 `TB_BOARD_MASTER` 는 앱 게시판과 공용 네이티브 쿼리를 쓰고 있어 손대면 영향 범위가
크므로 **지도 전용 테이블로 격리**했다(`TB_VENDOR_STORY`, `TB_VENDOR_STORY_COMMENT`).

- 비로그인 열람·작성 허용 (표시 이름을 비우면 "익명")
- 삭제는 작성자 본인만 (로그인 필요 — 비로그인 글은 주체 확인 불가)
- 댓글 수는 캐시 컬럼이며 등록/삭제 시 실제 건수로 재계산한다

## 7. 광고

`TB_VENDOR_AD` — 지역 타겟(시도/시군구, NULL=전국) + 기간 + 등급 + 노출/클릭 집계.

- 좌측 패널 최상단에 최대 2건 노출. 조회 시 노출수가 서버에서 자동 집계된다
- 클릭 시 `POST /web/vendor/ads/{id}/click` 으로 집계 후 랜딩 URL 로 이동
  (랜딩이 없으면 업체 상세를 연다)
- **노출 우선순위: 시군구 일치 → 시도 일치 → 전국, 그다음 등급 높은 순, 그다음 노출 적은 순**
  (같은 등급 안에서 균등 노출)
- 지도 마커 우선순위는 `TB_VENDOR.AD_TIER` 로 반영된다.
  광고 등록/종료 후 `WebVendorAdSvc.syncAdTier()` 를 호출해야 마커에 반영된다

### 광고 등록 화면
**`/boss/ads`** (사이드바 '인사이트' → 지도 광고). 목록·노출/클릭/클릭률·등록·중지.

관리 API 는 `/web/vendor-ad` 하위(인증)를 쓴다. 노출용 `/web/vendor` 하위는 permitAll 이라
같은 경로에 두면 광고 등록이 비로그인에게 열리기 때문이다.

| 엔드포인트 | 용도 |
|---|---|
| `POST /web/vendor-ad/my` | 내 업체 광고 목록 |
| `POST /web/vendor-ad/create` | 등록 (즉시 `syncAdTier()` 로 마커 반영) |
| `POST /web/vendor-ad/{id}/stop` | 게시 중지 |

업체 연결은 `TB_USER.COMPANY_ID` → `TB_VENDOR.COMPANY_ID` 다.
회사 주소가 없어 지도에 미등록이면 화면에서 주소 등록을 안내한다.

## 8. 현재 적재된 데이터 (2026-07-28)

| 항목 | 건수 |
|---|---|
| `TB_VENDOR` | **136곳** (전부 회원사, 15개 시도, 82개 시군구) |
| 지오코딩 실패 | 41곳 — 좌표를 추측하지 않고 건너뜀 |
| `TB_VENDOR_LINK` | 3건 (모두 네이버 블로그, 출처 `HOMEPAGE`) |
| `TB_VENDOR_AD` | 0건 |
| `TB_VENDOR_STORY` | 0건 |

회원사는 `member_sync` 로 적재했다. 지오코더가 Nominatim(OSM) 이라 적중률이 77% 였다.
**NCP 키를 넣고 다시 돌리면 실패한 41곳도 대부분 채워진다** — `member_sync` 는 upsert 라
그냥 다시 실행하면 된다.
```bash
# python/.env 에 NAVER_MAP_CLIENT_ID / NAVER_MAP_CLIENT_SECRET 추가 후
python3 -m vendor.member_sync
```

상가정보 CSV 를 넣으면 `SOURCE='SBIZ'` 로 전국 업체가 추가된다(3장 참고).

## 9. 남은 작업
- 상가정보 CSV 적재 — 전국 업체 확보 (CSV 다운로드만 필요)
- 지오코딩 실패 41곳 — NCP 키로 재실행
- 업체 claim(내 업체 등록) 화면 — SNS 공식 링크를 업체가 직접 넣는 경로
- 광고 결제 연동 (등록/중지 화면은 `/boss/ads` 에 있음)
- 이야기 신고/차단
