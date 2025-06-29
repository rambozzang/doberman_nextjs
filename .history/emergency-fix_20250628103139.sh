#!/bin/bash

echo "🚨 도베르만 사이트 응급 복구 시작..."

# 1. Nginx 설정 백업 및 복원
echo "📁 Nginx 설정 백업 중..."
sudo cp /etc/nginx/sites-available/doberman.kr /etc/nginx/sites-available/doberman.kr.backup.$(date +%Y%m%d_%H%M%S)

echo "🔧 안전한 Nginx 설정 적용 중..."
sudo cp working-nginx.conf /etc/nginx/sites-available/doberman.kr

# 2. Nginx 설정 검증
echo "✅ Nginx 설정 검증 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정이 올바릅니다."
else
    echo "❌ Nginx 설정에 오류가 있습니다. 백업으로 복원합니다."
    sudo cp /etc/nginx/sites-available/doberman.kr.backup.* /etc/nginx/sites-available/doberman.kr
    sudo systemctl reload nginx
    exit 1
fi

# 3. 서비스 재시작
echo "🔄 서비스 재시작 중..."
sudo systemctl reload nginx
sleep 2

# 4. Next.js 앱 상태 확인 및 재시작
echo "🔍 Next.js 앱 상태 확인 중..."
if pm2 list | grep -q "doberman"; then
    echo "🔄 PM2로 Next.js 앱 재시작 중..."
    pm2 restart doberman
else
    echo "🚀 Next.js 앱 시작 중..."
    cd /home/doberman/doberman
    pm2 start npm --name "doberman" -- start
fi

sleep 3

# 5. 연결 테스트
echo "🌐 사이트 연결 테스트 중..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ Next.js 앱이 정상 작동 중입니다."
else
    echo "❌ Next.js 앱 연결에 문제가 있습니다."
fi

if curl -s -o /dev/null -w "%{http_code}" https://www.doberman.kr | grep -q "200\|301\|302"; then
    echo "✅ 사이트가 정상적으로 접속됩니다!"
else
    echo "❌ 사이트 접속에 문제가 있습니다."
fi

echo "🎉 응급 복구 완료!"
echo "📋 확인사항:"
echo "   - 사이트: https://www.doberman.kr"
echo "   - 로그: sudo tail -f /data/logs/www.doberman.kr.error.log"
echo "   - PM2 상태: pm2 status" 