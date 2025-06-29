#!/bin/bash

echo "🚨 응급 복구 스크립트 실행 중..."

# 1. 백업에서 복원
echo "📁 기존 설정으로 복원 중..."
if [ -f "/etc/nginx/sites-available/doberman.kr.backup" ]; then
    sudo cp /etc/nginx/sites-available/doberman.kr.backup /etc/nginx/sites-available/doberman.kr
    echo "✅ 백업에서 복원 완료"
else
    echo "❌ 백업 파일이 없습니다. 수동으로 복원해야 합니다."
fi

# 2. 설정 검증
echo "🔍 Nginx 설정 검증 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정이 유효합니다"
    
    # 3. Nginx 재시작
    echo "🔄 Nginx 재시작 중..."
    sudo systemctl reload nginx
    
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ Nginx가 정상적으로 실행 중입니다"
    else
        echo "❌ Nginx 재시작 실패"
        sudo systemctl status nginx
    fi
else
    echo "❌ Nginx 설정에 오류가 있습니다"
    sudo nginx -t
fi

# 4. Next.js 서버 상태 확인
echo "🔍 Next.js 서버 상태 확인 중..."
if pm2 list | grep -q doberman; then
    echo "✅ PM2에서 doberman 프로세스 발견"
    pm2 status doberman
else
    echo "❌ doberman 프로세스가 PM2에 없습니다"
    echo "Next.js 서버를 시작합니다..."
    pm2 start npm --name "doberman" -- start
fi

# 5. 포트 3000 확인
echo "🔍 포트 3000 상태 확인 중..."
if netstat -tulpn | grep :3000; then
    echo "✅ 포트 3000에서 서비스가 실행 중입니다"
else
    echo "❌ 포트 3000에 서비스가 없습니다"
    echo "Next.js 서버를 재시작합니다..."
    pm2 restart doberman
fi

# 6. 연결 테스트
echo "🔍 로컬 연결 테스트 중..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ localhost:3000 연결 성공"
else
    echo "❌ localhost:3000 연결 실패"
fi

# 7. 외부 연결 테스트
echo "🔍 외부 연결 테스트 중..."
if curl -s https://www.doberman.kr > /dev/null; then
    echo "✅ https://www.doberman.kr 연결 성공"
    echo "🎉 사이트가 정상적으로 복구되었습니다!"
else
    echo "❌ https://www.doberman.kr 연결 실패"
    echo "추가 진단이 필요합니다."
fi

echo ""
echo "📋 진단 결과 요약:"
echo "- Nginx 상태: $(sudo systemctl is-active nginx)"
echo "- PM2 doberman 상태: $(pm2 jlist | jq -r '.[] | select(.name=="doberman") | .pm2_env.status' 2>/dev/null || echo "unknown")"
echo "- 포트 3000: $(netstat -tulpn | grep :3000 | wc -l) 개 프로세스"

echo ""
echo "🔧 문제가 지속되면 다음 명령어를 실행하세요:"
echo "sudo systemctl status nginx"
echo "pm2 logs doberman"
echo "sudo tail -f /data/logs/www.doberman.kr.error.log" 