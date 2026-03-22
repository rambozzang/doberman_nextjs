#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 스크립트 시작
log_info "🚀 도배맨 프로젝트 빌드 및 배포 파일 생성을 시작합니다..."

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    log_error "package.json 파일을 찾을 수 없습니다. 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 기존 빌드 파일 정리
log_info "🧹 기존 빌드 파일을 정리합니다..."
rm -rf .next
rm -rf out
rm -f doberman.tar.gz

# node_modules 정리 (안전하게)
log_info "🧹 기존 node_modules를 정리합니다..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    log_success "node_modules 정리 완료"
fi

# 의존성 설치
log_info "📦 의존성을 설치합니다..."
# npm ci가 실패하면 npm install로 대체
if npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps; then
    log_success "의존성 설치 완료"
else
    log_error "의존성 설치 실패"
    exit 1
fi

# 프로젝트 빌드
log_info "🔨 프로젝트를 빌드합니다..."
if npm run build; then
    log_success "빌드 완료"
else
    log_error "빌드 실패"
    exit 1
fi

# 임시 배포 디렉토리 생성
DEPLOY_DIR="doberman-deploy"
log_info "📁 배포 디렉토리를 생성합니다..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 필요한 파일들 복사
log_info "📋 배포에 필요한 파일들을 복사합니다..."

# Next.js 빌드 결과물
cp -r .next $DEPLOY_DIR/
log_success ".next 디렉토리 복사 완료"

# 정적 파일들
cp -r public $DEPLOY_DIR/
log_success "public 디렉토리 복사 완료"

# 패키지 파일들
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
log_success "패키지 파일들 복사 완료"

# 설정 파일들
cp next.config.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp tailwind.config.js $DEPLOY_DIR/
cp postcss.config.mjs $DEPLOY_DIR/
cp eslint.config.mjs $DEPLOY_DIR/

# 최적화 설정 파일들
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js $DEPLOY_DIR/
    log_success "기본 PM2 설정 파일 복사 완료"
fi

# 새로 생성된 최적화 파일들
if [ -f "ecosystem-optimized.config.js" ]; then
    cp ecosystem-optimized.config.js $DEPLOY_DIR/
    log_success "최적화된 PM2 설정 파일 복사 완료"
fi

if [ -f "keep-alive.sh" ]; then
    cp keep-alive.sh $DEPLOY_DIR/
    chmod +x $DEPLOY_DIR/keep-alive.sh
    log_success "Keep-alive 스크립트 복사 완료"
fi

if [ -f "nginx-doberman.conf" ]; then
    cp nginx-doberman.conf $DEPLOY_DIR/
    log_success "기본 Nginx 설정 파일 복사 완료"
fi

if [ -f "nginx-doberman-performance.conf" ]; then
    cp nginx-doberman-performance.conf $DEPLOY_DIR/
    log_success "최적화된 Nginx 설정 파일 복사 완료"
fi

if [ -f "nginx-doberman-optimized.conf" ]; then
    cp nginx-doberman-optimized.conf $DEPLOY_DIR/
    log_success "Nginx 최적화 설정 파일 복사 완료"
fi

if [ -f "monitoring-script.sh" ]; then
    cp monitoring-script.sh $DEPLOY_DIR/
    chmod +x $DEPLOY_DIR/monitoring-script.sh
    log_success "모니터링 스크립트 복사 완료"
fi

if [ -f "PERFORMANCE_GUIDE.md" ]; then
    cp PERFORMANCE_GUIDE.md $DEPLOY_DIR/
    log_success "성능 최적화 가이드 복사 완료"
fi

if [ -f "server-restart.sh" ]; then
    cp server-restart.sh $DEPLOY_DIR/
    chmod +x $DEPLOY_DIR/server-restart.sh
    log_success "서버 재기동 스크립트 복사 완료"
fi

if [ -f "quick-restart.sh" ]; then
    cp quick-restart.sh $DEPLOY_DIR/
    chmod +x $DEPLOY_DIR/quick-restart.sh
    log_success "빠른 재기동 스크립트 복사 완료"
fi

if [ -f "health-check.sh" ]; then
    cp health-check.sh $DEPLOY_DIR/
    chmod +x $DEPLOY_DIR/health-check.sh
    log_success "헬스체크 스크립트 복사 완료"
fi

log_success "설정 파일들 복사 완료"

# 소스 코드 (서버 사이드 렌더링을 위해 필요)
cp -r src $DEPLOY_DIR/
log_success "소스 코드 복사 완료"

# 환경 파일 (있는 경우)
if [ -f ".env.local" ]; then
    cp .env.local $DEPLOY_DIR/
    log_success ".env.local 파일 복사 완료"
fi

if [ -f ".env.production" ]; then
    cp .env.production $DEPLOY_DIR/
    log_success ".env.production 파일 복사 완료"
fi

# 배포 스크립트 생성
log_info "📜 서버 배포 스크립트를 생성합니다..."
cat > $DEPLOY_DIR/deploy-server.sh << 'EOF'
#!/bin/bash

echo "🚀 도배맨 서버 배포를 시작합니다..."

# PM2가 설치되어 있는지 확인
if ! command -v pm2 &> /dev/null; then
    echo "PM2가 설치되어 있지 않습니다. 설치를 진행합니다..."
    npm install -g pm2
fi

# 의존성 설치 (프로덕션 모드)
echo "📦 프로덕션 의존성을 설치합니다..."
npm ci --only=production

# 기존 프로세스 중지 (있는 경우)
pm2 stop doberman 2>/dev/null || true
pm2 delete doberman 2>/dev/null || true

# 새 프로세스 시작 (최적화된 설정 사용)
echo "🔄 애플리케이션을 시작합니다..."
if [ -f "ecosystem-optimized.config.js" ]; then
    echo "🚀 최적화된 PM2 설정으로 시작합니다..."
    pm2 start ecosystem-optimized.config.js --env production
else
    echo "⚠️  기본 PM2 설정으로 시작합니다..."
    pm2 start npm --name "doberman" -- start
fi

# PM2 설정 저장
pm2 save
pm2 startup

echo "✅ 배포가 완료되었습니다!"
echo ""
echo "📊 상태 확인: pm2 status"
echo "📋 로그 확인: pm2 logs doberman"
echo "🔍 모니터링: pm2 monit"
echo ""
echo "🎯 성능 최적화 적용 방법:"
echo "   1. Nginx 설정: sudo cp nginx-doberman-performance.conf /etc/nginx/sites-available/doberman.kr"
echo "   2. Nginx 재로드: sudo nginx -t && sudo systemctl reload nginx"
echo "   3. 모니터링 시작: ./monitoring-script.sh start"
echo "   4. 자세한 가이드: PERFORMANCE_GUIDE.md 참조"
EOF

chmod +x $DEPLOY_DIR/deploy-server.sh
log_success "서버 배포 스크립트 생성 완료"

# README 파일 생성
log_info "📝 배포 가이드를 생성합니다..."
cat > $DEPLOY_DIR/README-DEPLOY.md << 'EOF'
# 도배맨 서버 배포 가이드

## 배포 방법

1. **서버에 파일 업로드**
   ```bash
   scp doberman.tar.gz user@server:/path/to/deploy/
   ```

2. **서버에서 압축 해제**
   ```bash
    rm -rf doberman-deploy && mkdir -p doberman-deploy
    tar -xzf doberman.tar.gz -C doberman-deploy --overwrite --no-same-owner
    cd doberman-deploy
   ```

3. **배포 스크립트 실행**
   ```bash
   chmod +x deploy-server.sh
   ./deploy-server.sh
   ```

## 환경 변수 설정

배포 전에 필요한 환경 변수를 `.env.production` 파일에 설정하세요:

```env
NEXT_PUBLIC_BASE_URL=https://www.doberman.kr
GOOGLE_VERIFICATION_ID=your_google_verification_id
NAVER_VERIFICATION_ID=your_naver_verification_id
```

## 서버 요구사항

- Node.js 18.x 이상
- PM2 (프로세스 관리자)
- 최소 2GB RAM
- 최소 10GB 디스크 공간

## 유용한 명령어

- 상태 확인: `pm2 status`
- 로그 확인: `pm2 logs doberman`
- 재시작: `pm2 restart doberman`
- 중지: `pm2 stop doberman`
- 모니터링: `pm2 monit`

## 문제 해결

1. **포트 충돌**: 기본 포트는 3000입니다. 변경이 필요한 경우 `PORT` 환경 변수를 설정하세요.
2. **메모리 부족**: PM2 설정에서 메모리 제한을 조정하세요.
3. **빌드 오류**: `npm run build`를 다시 실행해보세요.
EOF

log_success "배포 가이드 생성 완료"

# tar.gz 파일 생성
log_info "📦 doberman.tar.gz 파일을 생성합니다..."
# macOS 확장 속성 경고 방지를 위해 COPYFILE_DISABLE 사용
if COPYFILE_DISABLE=1 tar -czf doberman.tar.gz --no-xattrs -C $DEPLOY_DIR .; then
    log_success "doberman.tar.gz 파일 생성 완료"
else
    log_error "tar.gz 파일 생성 실패"
    exit 1
fi

# 임시 디렉토리 정리
log_info "🧹 임시 파일을 정리합니다..."
rm -rf $DEPLOY_DIR

# 파일 크기 확인
FILE_SIZE=$(du -h doberman.tar.gz | cut -f1)
log_success "✅ 배포 파일이 준비되었습니다!"
echo ""
echo "📊 파일 정보:"
echo "   - 파일명: doberman.tar.gz"
echo "   - 크기: $FILE_SIZE"
echo "   - 위치: $(pwd)/doberman.tar.gz"
echo ""
echo "🚀 다음 단계:"
echo "   1. doberman.tar.gz 파일을 서버에 업로드"
echo "   2. 서버에서 기존 폴더 삭제 및 압축 해제: 
      rm -rf doberman-deploy && mkdir -p doberman-deploy
      tar -xzf doberman.tar.gz -C doberman-deploy --overwrite --no-same-owner
   3. 배포 스크립트 실행: cd doberman-deploy && ./deploy-server.sh"
echo ""
log_success "🎉 빌드 및 패키징이 완료되었습니다!"