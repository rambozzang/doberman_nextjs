#!/bin/bash

echo "🔍 도배맨 서비스 헬스체크"
echo "================================"

# 1. PM2 상태 확인
echo "📊 PM2 상태:"
pm2 status

echo ""
echo "🔍 포트 확인:"
netstat -tlnp | grep :3000 || echo "포트 3000이 열려있지 않습니다."

echo ""
echo "🌐 로컬 헬스체크:"
curl -v http://localhost:3000/api/health 2>&1 | head -20

echo ""
echo "🌍 외부 헬스체크:"
curl -v https://www.doberman.kr/api/health 2>&1 | head -20

echo ""
echo "📋 프로세스 확인:"
ps aux | grep -E "(node|npm|next)" | grep -v grep

echo ""
echo "📁 로그 확인:"
if [ -f "./logs/doberman-out.log" ]; then
    echo "최근 애플리케이션 로그:"
    tail -10 ./logs/doberman-out.log
else
    echo "애플리케이션 로그 파일이 없습니다."
fi

if [ -f "./logs/doberman-error.log" ]; then
    echo ""
    echo "최근 에러 로그:"
    tail -10 ./logs/doberman-error.log
fi 