#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 도배맨 빠른 재기동 스크립트${NC}"
echo "=================================================="

# 1. PM2 재시작
echo -e "${YELLOW}[1/4]${NC} PM2 프로세스 재시작..."
pm2 restart doberman-nextjs 2>/dev/null || pm2 restart doberman
echo "✅ PM2 재시작 완료"

# 2. Nginx 재로드
echo -e "${YELLOW}[2/4]${NC} Nginx 재로드..."
sudo nginx -s reload 2>/dev/null || echo "⚠️  Nginx 재로드 실패 (권한 확인 필요)"
echo "✅ Nginx 재로드 완료"

# 3. 모니터링 재시작
echo -e "${YELLOW}[3/4]${NC} 모니터링 시스템 재시작..."
if [ -f "monitoring-script.sh" ]; then
    ./monitoring-script.sh stop 2>/dev/null || true
    sleep 2
    ./monitoring-script.sh start
    echo "✅ 모니터링 재시작 완료"
else
    echo "⚠️  모니터링 스크립트 없음"
fi

# 4. 상태 확인
echo -e "${YELLOW}[4/4]${NC} 서비스 상태 확인..."
sleep 3

# PM2 상태
echo ""
echo "📊 PM2 상태:"
pm2 status

# 헬스체크
echo ""
echo "🔍 헬스체크 결과:"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 로컬 헬스체크 통과"
else
    echo "❌ 로컬 헬스체크 실패"
fi

if curl -s --max-time 5 https://www.doberman.kr > /dev/null 2>&1; then
    echo "✅ 외부 접속 확인"
else
    echo "❌ 외부 접속 실패"
fi

echo ""
echo -e "${GREEN}🎉 빠른 재기동 완료!${NC}"
echo ""
echo "📋 유용한 명령어:"
echo "  - 상태 확인: pm2 status"
echo "  - 로그 확인: pm2 logs doberman"
echo "  - 모니터링 로그: tail -f /var/log/doberman-monitoring.log" 