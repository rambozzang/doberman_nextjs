# 🚀 NextJS 성능 최적화 및 접속 문제 해결 가이드

## 📋 문제 상황

- NextJS 서비스의 간헐적 접속 문제
- 다른 Nginx 도메인은 정상이지만 NextJS만 접속 지연
- 한참 후에 접속되는 현상

## 🔍 원인 분석

1. **Nginx 타임아웃 설정 부족**
2. **NextJS 프로세스 단일 인스턴스 운영**
3. **연결 풀링 최적화 부족**
4. **메모리 관리 및 자동 재시작 이슈**

## 🛠️ 해결 방안

### 1. 최적화된 Nginx 설정 적용

```bash
# 기존 설정 백업
sudo cp /etc/nginx/sites-available/doberman.kr /etc/nginx/sites-available/doberman.kr.backup

# 새로운 설정 적용
sudo cp nginx-doberman-performance.conf /etc/nginx/sites-available/doberman.kr

# 설정 테스트
sudo nginx -t

# 적용
sudo systemctl reload nginx
```

### 2. PM2 클러스터 모드 설정

```bash
# 기존 프로세스 중지
pm2 stop doberman

# 새로운 설정으로 시작
pm2 start ecosystem-optimized.config.js --env production

# 저장
pm2 save
```

### 3. 헬스체크 API 추가

- `/api/health` 엔드포인트 생성됨
- 실시간 서버 상태 모니터링 가능

### 4. 자동 모니터링 시스템 설정

```bash
# 스크립트 실행 권한 부여
chmod +x monitoring-script.sh

# 백그라운드에서 모니터링 시작
./monitoring-script.sh start

# 한 번만 체크
./monitoring-script.sh once

# 모니터링 중지
./monitoring-script.sh stop
```

## 📊 주요 개선사항

### Nginx 최적화

- ✅ 연결 풀링 최적화 (keepalive 128)
- ✅ 타임아웃 설정 증가 (connect: 10s, read: 120s)
- ✅ 버퍼 크기 최적화 (256k → 512k)
- ✅ 에러 처리 및 재시도 로직 추가
- ✅ 정적 파일 캐싱 최적화

### PM2 최적화

- ✅ 클러스터 모드 (2 인스턴스)
- ✅ 메모리 제한 증가 (1G → 2G)
- ✅ Graceful shutdown 설정
- ✅ 자동 재시작 로직 개선

### 모니터링 시스템

- ✅ 실시간 헬스체크
- ✅ 자동 복구 시스템
- ✅ 시스템 리소스 모니터링
- ✅ 상세 로깅

## 🚀 배포 단계

### 1단계: 백업 및 준비

```bash
# 현재 설정 백업
sudo cp /etc/nginx/sites-available/doberman.kr /etc/nginx/sites-available/doberman.kr.$(date +%Y%m%d)
pm2 save

# 로그 디렉토리 생성
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 2단계: NextJS 헬스체크 API 배포

```bash
# 프로젝트 빌드
npm run build

# PM2로 재시작
pm2 restart doberman
```

### 3단계: Nginx 설정 적용

```bash
# 새 설정 복사
sudo cp nginx-doberman-performance.conf /etc/nginx/sites-available/doberman.kr

# 설정 검증
sudo nginx -t

# 적용
sudo systemctl reload nginx
```

### 4단계: PM2 클러스터 모드 적용

```bash
# 기존 프로세스 중지
pm2 delete doberman

# 새 설정으로 시작
pm2 start ecosystem-optimized.config.js --env production

# 저장
pm2 save
```

### 5단계: 모니터링 시스템 시작

```bash
# 실행 권한 부여
chmod +x monitoring-script.sh

# 백그라운드 모니터링 시작
./monitoring-script.sh start
```

## 📈 성능 모니터링

### 실시간 상태 확인

```bash
# 헬스체크 API 호출
curl https://www.doberman.kr/api/health

# PM2 상태 확인
pm2 status

# Nginx 상태 확인
sudo systemctl status nginx

# 로그 확인
tail -f /var/log/doberman-monitoring.log
```

### 성능 지표 모니터링

- **응답 시간**: 5초 이하 유지
- **메모리 사용량**: 90% 이하 유지
- **CPU 로드**: 서버 코어 수 이하 유지
- **에러율**: 1% 이하 유지

## 🔧 문제 해결

### 접속 지연 문제

1. **즉시 확인**: `curl -w "%{time_total}" https://www.doberman.kr`
2. **로그 확인**: `tail -f /var/log/doberman-monitoring.log`
3. **PM2 상태**: `pm2 status`
4. **수동 재시작**: `pm2 restart doberman`

### 메모리 부족 문제

1. **메모리 확인**: `free -h`
2. **프로세스 확인**: `pm2 monit`
3. **메모리 정리**: `pm2 restart doberman`

### Nginx 설정 문제

1. **설정 검증**: `sudo nginx -t`
2. **에러 로그**: `sudo tail -f /var/log/nginx/error.log`
3. **재로드**: `sudo nginx -s reload`

## 📞 긴급 상황 대응

### 서비스 완전 중단 시

```bash
# 1. PM2 강제 재시작
pm2 kill
pm2 start ecosystem-optimized.config.js --env production

# 2. Nginx 재시작
sudo systemctl restart nginx

# 3. 모니터링 재시작
./monitoring-script.sh stop
./monitoring-script.sh start
```

### 롤백 절차

```bash
# Nginx 설정 롤백
sudo cp /etc/nginx/sites-available/doberman.kr.backup /etc/nginx/sites-available/doberman.kr
sudo nginx -t && sudo systemctl reload nginx

# PM2 설정 롤백
pm2 delete doberman
pm2 start ecosystem.config.js --env production
```

## 📋 체크리스트

### 배포 전 확인사항

- [ ] 현재 설정 백업 완료
- [ ] 헬스체크 API 테스트 완료
- [ ] Nginx 설정 검증 완료
- [ ] PM2 설정 검증 완료

### 배포 후 확인사항

- [ ] 사이트 접속 정상 확인
- [ ] 헬스체크 API 응답 확인
- [ ] PM2 클러스터 모드 동작 확인
- [ ] 모니터링 시스템 동작 확인
- [ ] 응답 시간 개선 확인

## 🎯 기대 효과

- **접속 안정성**: 99.9% 이상 가용성
- **응답 시간**: 평균 2초 이하
- **자동 복구**: 문제 발생 시 자동 해결
- **실시간 모니터링**: 24/7 서비스 상태 추적

이 가이드를 따라 적용하시면 NextJS 서비스의 접속 문제가 크게 개선될 것입니다!
