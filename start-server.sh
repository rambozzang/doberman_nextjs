#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 도배맨 서버 시작 스크립트${NC}"
echo "=================================================="
echo ""

# 현재 디렉토리 확인
CURRENT_DIR=$(pwd)
echo -e "${YELLOW}[1/6]${NC} 현재 디렉토리: $CURRENT_DIR"

# 프로젝트 파일 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json을 찾을 수 없습니다.${NC}"
    echo "올바른 프로젝트 디렉토리에서 실행해주세요."
    exit 1
fi

# PM2 설치 확인
echo -e "${YELLOW}[2/6]${NC} PM2 설치 확인..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2가 설치되어 있지 않습니다. 설치 중..."
    npm install -g pm2 || sudo npm install -g pm2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 설치 실패${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PM2 설치 확인${NC}"

# .next 빌드 확인
echo -e "${YELLOW}[3/6]${NC} 빌드 확인..."
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}⚠️  .next 디렉토리가 없습니다. 빌드 실행 중...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 빌드 실패${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ 빌드 확인${NC}"

# PM2 설정 파일 확인 및 경로 수정
echo -e "${YELLOW}[4/6]${NC} PM2 설정 파일 확인..."
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

# 기존 프로세스 확인 및 삭제
echo -e "${YELLOW}[5/6]${NC} 기존 프로세스 확인..."
if pm2 list | grep -q "doberman"; then
    echo "기존 doberman 프로세스를 삭제합니다..."
    pm2 delete doberman 2>/dev/null || true
    pm2 delete doberman-nextjs 2>/dev/null || true
    sleep 1
fi

# 새 프로세스 시작
echo "새 프로세스 시작 중..."
if [ -n "$PM2_CONFIG" ]; then
    pm2 start "$PM2_CONFIG" --env production
else
    pm2 start npm --name "doberman" -- start
fi

# PM2 설정 저장
pm2 save
echo -e "${GREEN}✅ PM2 설정 저장 완료${NC}"

# PM2 자동 시작 설정
echo -e "${YELLOW}[6/6]${NC} PM2 자동 시작 설정 (재부팅 후 자동 시작)..."
STARTUP_OUTPUT=$(pm2 startup systemd -u $USER --hp $HOME 2>&1)
if echo "$STARTUP_OUTPUT" | grep -q "sudo"; then
    echo -e "${YELLOW}⚠️  다음 명령어를 실행해야 합니다:${NC}"
    echo "$STARTUP_OUTPUT" | grep "sudo"
    echo ""
    echo -e "${YELLOW}또는 수동으로 실행:${NC}"
    echo "pm2 startup systemd -u $USER --hp $HOME"
else
    echo -e "${GREEN}✅ PM2 자동 시작 설정 완료${NC}"
fi

# 상태 확인
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 서버 시작 완료!${NC}"
echo ""
echo "📊 PM2 상태:"
pm2 status
echo ""
echo "📋 유용한 명령어:"
echo "  - 상태 확인: pm2 status"
echo "  - 로그 확인: pm2 logs doberman"
echo "  - 재시작: pm2 restart doberman"
echo "  - 중지: pm2 stop doberman"
echo "  - 헬스체크: curl http://localhost:3000/api/health"
echo ""

# 헬스체크
sleep 3
echo "🔍 헬스체크 수행 중..."
if curl -s --max-time 5 http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 서버 정상 동작 확인${NC}"
else
    echo -e "${YELLOW}⚠️  서버 응답 대기 중... (몇 초 후 다시 확인해주세요)${NC}"
    echo "로그 확인: pm2 logs doberman --lines 30"
fi
