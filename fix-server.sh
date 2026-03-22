#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 도배맨 서버 문제 해결 스크립트${NC}"
echo "=================================================="
echo ""

# 1. 현재 디렉토리 확인
CURRENT_DIR=$(pwd)
echo -e "${YELLOW}[1/7]${NC} 현재 디렉토리: $CURRENT_DIR"

# 2. PM2 상태 확인
echo -e "${YELLOW}[2/7]${NC} PM2 프로세스 상태 확인..."
if command -v pm2 &> /dev/null; then
    echo "PM2 프로세스 목록:"
    pm2 list
    echo ""
    
    # doberman 프로세스 확인
    if pm2 list | grep -q "doberman"; then
        echo -e "${GREEN}✅ doberman 프로세스 발견${NC}"
        PM2_STATUS=$(pm2 list | grep "doberman" | awk '{print $10}')
        echo "상태: $PM2_STATUS"
        
        if [ "$PM2_STATUS" != "online" ]; then
            echo -e "${RED}❌ 프로세스가 실행 중이 아닙니다. 재시작합니다...${NC}"
            pm2 restart doberman || pm2 restart doberman-nextjs || true
        fi
    else
        echo -e "${RED}❌ doberman 프로세스를 찾을 수 없습니다.${NC}"
    fi
else
    echo -e "${RED}❌ PM2가 설치되어 있지 않습니다.${NC}"
    echo "PM2 설치 중..."
    npm install -g pm2 || sudo npm install -g pm2
fi

# 3. 포트 3000 확인
echo ""
echo -e "${YELLOW}[3/7]${NC} 포트 3000 사용 상태 확인..."
if lsof -i :3000 &> /dev/null || netstat -tuln | grep -q ":3000"; then
    echo -e "${GREEN}✅ 포트 3000이 사용 중입니다${NC}"
    lsof -i :3000 2>/dev/null || netstat -tuln | grep ":3000" || true
else
    echo -e "${RED}❌ 포트 3000이 사용되지 않고 있습니다${NC}"
fi

# 4. 프로젝트 디렉토리 확인
echo ""
echo -e "${YELLOW}[4/7]${NC} 프로젝트 파일 확인..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json을 찾을 수 없습니다.${NC}"
    echo "올바른 디렉토리에서 실행해주세요."
    exit 1
fi

if [ ! -d ".next" ]; then
    echo -e "${YELLOW}⚠️  .next 디렉토리가 없습니다. 빌드가 필요합니다.${NC}"
    echo "빌드 실행 중..."
    npm run build
fi

# 5. PM2 설정 파일 확인 및 경로 수정
echo ""
echo -e "${YELLOW}[5/7]${NC} PM2 설정 파일 확인..."
if [ -f "ecosystem-optimized.config.js" ]; then
    echo -e "${GREEN}✅ ecosystem-optimized.config.js 발견${NC}"
    # 경로 수정
    sed -i.bak "s|/path/to/doberman-deploy|$CURRENT_DIR|g" ecosystem-optimized.config.js 2>/dev/null || true
    PM2_CONFIG="ecosystem-optimized.config.js"
elif [ -f "ecosystem.config.js" ]; then
    echo -e "${GREEN}✅ ecosystem.config.js 발견${NC}"
    # 경로 수정
    sed -i.bak "s|/path/to/doberman-deploy|$CURRENT_DIR|g" ecosystem.config.js 2>/dev/null || true
    PM2_CONFIG="ecosystem.config.js"
else
    echo -e "${YELLOW}⚠️  PM2 설정 파일이 없습니다. 기본 설정으로 시작합니다.${NC}"
    PM2_CONFIG=""
fi

# 6. 서버 재시작
echo ""
echo -e "${YELLOW}[6/8]${NC} 서버 재시작..."
if pm2 list | grep -q "doberman"; then
    echo "기존 프로세스 재시작 중..."
    pm2 restart doberman || pm2 restart doberman-nextjs || true
    sleep 2
else
    echo "새 프로세스 시작 중..."
    if [ -n "$PM2_CONFIG" ]; then
        pm2 start "$PM2_CONFIG" --env production
    else
        pm2 start npm --name "doberman" -- start
    fi
    sleep 3
fi

# PM2 설정 저장
pm2 save

# 7. PM2 자동 시작 설정 (재부팅 후 자동 시작)
echo ""
echo -e "${YELLOW}[7/8]${NC} PM2 자동 시작 설정..."
if ! pm2 startup | grep -q "already"; then
    echo "PM2 startup 설정 중..."
    STARTUP_CMD=$(pm2 startup | grep -E "sudo|pm2" | tail -1)
    if [ -n "$STARTUP_CMD" ]; then
        echo -e "${YELLOW}⚠️  다음 명령어를 실행해야 합니다:${NC}"
        echo "$STARTUP_CMD"
        echo ""
        echo -e "${YELLOW}또는 자동으로 설정하려면:${NC}"
        echo "pm2 startup systemd -u $USER --hp $HOME"
    fi
else
    echo -e "${GREEN}✅ PM2 startup이 이미 설정되어 있습니다${NC}"
fi

# 8. 헬스체크
echo ""
echo -e "${YELLOW}[8/8]${NC} 헬스체크 수행..."
sleep 3

# 로컬 헬스체크
echo "로컬 헬스체크 (http://localhost:3000/api/health)..."
if curl -s --max-time 5 http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 로컬 서버 정상 동작${NC}"
    curl -s http://localhost:3000/api/health | head -5
else
    echo -e "${RED}❌ 로컬 서버 응답 없음${NC}"
    echo ""
    echo "PM2 로그 확인:"
    pm2 logs doberman --lines 20 --nostream || pm2 logs doberman-nextjs --lines 20 --nostream || true
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 서버 문제 해결 스크립트 완료!${NC}"
echo ""
echo "📋 유용한 명령어:"
echo "  - PM2 상태: pm2 status"
echo "  - PM2 로그: pm2 logs doberman"
echo "  - PM2 모니터링: pm2 monit"
echo "  - 포트 확인: lsof -i :3000"
echo "  - 헬스체크: curl http://localhost:3000/api/health"
echo ""

