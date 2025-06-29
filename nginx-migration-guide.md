# Nginx 설정 마이그레이션 가이드

## 1단계: 백업 생성

```bash
# 현재 설정 백업
sudo cp /etc/nginx/sites-available/doberman.kr /etc/nginx/sites-available/doberman.kr.backup
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

## 2단계: 보안 설정 우선 적용

```bash
# 현재 설정 파일 편집
sudo nano /etc/nginx/sites-available/doberman.kr
```

다음 부분을 우선 수정:

```nginx
# 위험한 SSL 프로토콜 제거
ssl_protocols TLSv1.2 TLSv1.3;  # SSLv2, SSLv3, TLSv1, TLSv1.1 제거

# 강화된 암호화 스위트
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

## 3단계: 성능 최적화 추가

```nginx
# 파일 상단에 업스트림 추가
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# location / 블록 수정
location / {
    proxy_pass http://nextjs_backend;  # http://localhost:3000 대신
    # ... 기존 설정 유지

    # 추가 최적화 옵션
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffering on;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
}
```

## 4단계: 정적 파일 처리 수정

```nginx
# ❌ 제거할 부분
location /_next/static/ {
    alias /data/www/www.doberman.kr/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /public/ {
    alias /data/www/www.doberman.kr/public/;
    expires 1y;
    add_header Cache-Control "public";
}

# ✅ 추가할 부분
location /_next/static/ {
    proxy_pass http://nextjs_backend;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
    proxy_pass http://nextjs_backend;
    expires 30d;
    add_header Cache-Control "public, no-transform";
    access_log off;
}
```

## 5단계: 검증 및 적용

```bash
# 설정 검증
sudo nginx -t

# 성공하면 적용
sudo systemctl reload nginx

# 실패하면 백업으로 복원
sudo cp /etc/nginx/sites-available/doberman.kr.backup /etc/nginx/sites-available/doberman.kr
sudo systemctl reload nginx
```

## 6단계: 성능 테스트

```bash
# 응답 시간 테스트
curl -w "@curl-format.txt" -o /dev/null -s "https://www.doberman.kr"

# SSL 등급 확인
curl -I https://www.doberman.kr

# 압축 확인
curl -H "Accept-Encoding: gzip" -I https://www.doberman.kr
```

## 7단계: 모니터링

```bash
# 에러 로그 모니터링
sudo tail -f /data/logs/www.doberman.kr.error.log

# 액세스 로그 모니터링
sudo tail -f /data/logs/www.doberman.kr.access.log

# Nginx 상태 확인
sudo systemctl status nginx
```

## 문제 해결

### SSL 인증서 오류

```bash
# 인증서 갱신
sudo certbot renew

# 인증서 확인
sudo certbot certificates
```

### 502 Bad Gateway 오류

```bash
# Next.js 서버 상태 확인
pm2 status

# Next.js 서버 재시작
pm2 restart doberman
```

### 성능 문제

```bash
# Nginx 프로세스 확인
ps aux | grep nginx

# 연결 상태 확인
ss -tulpn | grep :443
```
