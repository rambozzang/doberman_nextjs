# 전국 도배업체 지도(/map) 설정 가이드

작성일: 2026-07-28

## 1. 필요한 키 2개

### 1-1. 네이버 지도 (필수 — 없으면 지도가 안 뜸)
NAVER Cloud Platform → **Maps → Web Dynamic Map** 에서 발급.
**네이버 로그인 API 키(`NEXT_PUBLIC_NAVER_CLIENT_ID`)와 다른 키다.**

`web/.env.local` 에 추가:
```
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_키
# 신규 콘솔 키는 ncpKeyId(기본값). 구 콘솔 키라면 아래를 ncpClientId 로 지정
# NEXT_PUBLIC_NAVER_MAP_AUTH_PARAM=ncpClientId
```

발급 시 **Web 서비스 URL** 에 `https://www.doberman.kr` 과 `http://localhost:3000` 을 등록해야 한다.
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

## 5. SNS/플랫폼 링크 (현재 1차 구현)

`src/app/map/socialLinks.ts` — 인스타그램·틱톡·유튜브·당근·숨고·크몽.

**현재는 업체명+지역 검색 URL 로 이동한다.** 6개 플랫폼을 스크래핑하면 각 사 약관 위반이자
차단 위험이 크고, 상호명만으로 계정을 자동 매칭하면 동명 업체 오탐이 심하기 때문이다.
업체가 직접 등록(claim)한 공식 URL 을 우선 노출하는 것이 다음 단계다.

동작 확인이 필요한 URL 패턴: `daangn`, `soomgo`, `kmong` (`verified: false` 로 표시됨).
각 사가 경로를 바꾸면 이 파일 한 곳만 고치면 된다.

## 6. 남은 작업
- 회원사(`TB_COMPANY` 177건) 지오코딩 후 `TB_VENDOR` 병합 (`MEMBER_YN='Y'`)
- 업체 claim + SNS 공식 링크 등록
- 광고 슬롯 (`AD_TIER` 컬럼은 준비됨)
- 업체 커뮤니티(이야기)
