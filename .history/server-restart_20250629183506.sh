#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# 에러 발생 시 종료
set -e

# 스크립트 시작
clear
log_header "🚀 도배맨 서버 재기동 스크립트"
echo ""
log_info "현재 시간: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "작업 디렉토리: $(pwd)"
echo ""

# 루트 권한 확인
if [[ $EUID -eq 0 ]]; then
   log_warning "루트 권한으로 실행 중입니다. 일반 사용자 권한을 권장합니다."
fi

# 필수 파일 존재 확인
log_info "📋 필수 파일 존재 여부를 확인합니다..."
required_files=("package.json" ".next" "ecosystem-optimized.config.js" "nginx-doberman-performance.conf")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    log_error "다음 필수 파일들이 없습니다:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    log_error "doberman.tar.gz 파일을 올바르게 압축 해제했는지 확인해주세요."
    exit 1
fi

log_success "모든 필수 파일이 존재합니다."

# 백업 디렉토리 생성
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
log_info "📁 백업 디렉토리를 생성합니다: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 1. 기존 PM2 프로세스 상태 확인 및 백업
log_header "1. 기존 서비스 상태 확인 및 백업"

if command -v pm2 &> /dev/null; then
    log_info "PM2가 설치되어 있습니다."
    
    # PM2 프로세스 목록 백업
    pm2 jlist > "$BACKUP_DIR/pm2-processes-backup.json" 2>/dev/null || true
    log_success "PM2 프로세스 목록을 백업했습니다."
    
    # 현재 실행 중인 doberman 프로세스 확인
    if pm2 show doberman &> /dev/null; then
        log_info "기존 doberman 프로세스가 실행 중입니다."
        pm2 describe doberman > "$BACKUP_DIR/doberman-process-info.txt" 2>/dev/null || true
        
        # Graceful shutdown
        log_info "기존 doberman 프로세스를 안전하게 종료합니다..."
        pm2 stop doberman
        sleep 3
        pm2 delete doberman
        log_success "기존 프로세스가 안전하게 종료되었습니다."
    else
        log_info "실행 중인 doberman 프로세스가 없습니다."
    fi
else
    log_warning "PM2가 설치되어 있지 않습니다. 설치를 진행합니다..."
    npm install -g pm2
    log_success "PM2 설치가 완료되었습니다."
fi

# 2. Nginx 설정 백업 및 업데이트
log_header "2. Nginx 설정 백업 및 업데이트"

NGINX_SITE_PATH="/etc/nginx/sites-available/doberman.kr"
if [ -f "$NGINX_SITE_PATH" ]; then
    log_info "기존 Nginx 설정을 백업합니다..."
    sudo cp "$NGINX_SITE_PATH" "$BACKUP_DIR/nginx-doberman.kr.backup" 2>/dev/null || {
        log_warning "Nginx 설정 백업에 실패했습니다. 권한을 확인해주세요."
    }
fi

# 새로운 Nginx 설정 적용
if [ -f "nginx-doberman-performance.conf" ]; then
    log_info "최적화된 Nginx 설정을 적용합니다..."
    sudo cp nginx-doberman-performance.conf "$NGINX_SITE_PATH" 2>/dev/null || {
        log_error "Nginx 설정 파일 복사에 실패했습니다. sudo 권한이 필요합니다."
        log_info "수동으로 실행해주세요: sudo cp nginx-doberman-performance.conf $NGINX_SITE_PATH"
    }
    
    # Nginx 설정 테스트
    log_info "Nginx 설정을 테스트합니다..."
    if sudo nginx -t 2>/dev/null; then
        log_success "Nginx 설정 테스트 통과"
        
        # Nginx 재로드
        log_info "Nginx를 재로드합니다..."
        sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload
        log_success "Nginx 재로드 완료"
    else
        log_error "Nginx 설정 테스트 실패. 기존 설정을 유지합니다."
        if [ -f "$BACKUP_DIR/nginx-doberman.kr.backup" ]; then
            sudo cp "$BACKUP_DIR/nginx-doberman.kr.backup" "$NGINX_SITE_PATH"
            sudo nginx -s reload
        fi
    fi
else
    log_warning "nginx-doberman-performance.conf 파일이 없습니다."
fi

# 3. Node.js 의존성 설치
log_header "3. Node.js 의존성 설치"

log_info "프로덕션 의존성을 설치합니다..."
if npm ci --only=production --silent; then
    log_success "의존성 설치 완료"
else
    log_error "의존성 설치 실패"
    exit 1
fi

# 4. 환경 변수 확인
log_header "4. 환경 변수 확인"

if [ -f ".env.production" ]; then
    log_success ".env.production 파일이 존재합니다."
elif [ -f ".env.local" ]; then
    log_success ".env.local 파일이 존재합니다."
else
    log_warning "환경 변수 파일이 없습니다. 필요시 생성해주세요."
fi

# 5. PM2로 애플리케이션 시작
log_header "5. 최적화된 설정으로 애플리케이션 시작"

if [ -f "ecosystem-optimized.config.js" ]; then
    log_info "최적화된 PM2 설정으로 애플리케이션을 시작합니다..."
    
    # ecosystem-optimized.config.js의 경로 수정
    sed -i.bak "s|/path/to/doberman-deploy|$(pwd)|g" ecosystem-optimized.config.js
    
    # PM2로 시작
    pm2 start ecosystem-optimized.config.js --env production
    log_success "애플리케이션이 클러스터 모드로 시작되었습니다."
else
    log_warning "최적화된 설정이 없습니다. 기본 설정으로 시작합니다..."
    pm2 start npm --name "doberman" -- start
    log_success "애플리케이션이 기본 모드로 시작되었습니다."
fi

# PM2 설정 저장
pm2 save
log_success "PM2 설정이 저장되었습니다."

# 6. 모니터링 시스템 시작
log_header "6. 모니터링 시스템 시작"

if [ -f "monitoring-script.sh" ]; then
    # 기존 모니터링 프로세스 중지
    if [ -f "/var/run/doberman-monitoring.pid" ]; then
        log_info "기존 모니터링 프로세스를 중지합니다..."
        ./monitoring-script.sh stop 2>/dev/null || true
    fi
    
    # 새로운 모니터링 시작
    log_info "모니터링 시스템을 시작합니다..."
    chmod +x monitoring-script.sh
    ./monitoring-script.sh start
    log_success "모니터링 시스템이 시작되었습니다."
else
    log_warning "모니터링 스크립트가 없습니다."
fi

# 7. 서비스 상태 확인
log_header "7. 서비스 상태 확인"

sleep 5

# PM2 상태 확인
log_info "PM2 프로세스 상태를 확인합니다..."
pm2 status

# 헬스체크
log_info "헬스체크를 수행합니다..."
HEALTH_CHECK_URL="http://localhost:3000/api/health"

for i in {1..5}; do
    if curl -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        log_success "헬스체크 통과 (시도 $i/5)"
        break
    else
        log_warning "헬스체크 실패 (시도 $i/5) - 5초 후 재시도..."
        sleep 5
    fi
    
    if [ $i -eq 5 ]; then
        log_error "헬스체크 최종 실패. 서비스 상태를 확인해주세요."
    fi
done

# 외부 접속 확인
log_info "외부 접속을 확인합니다..."
EXTERNAL_URL="https://www.doberman.kr"

if curl -s --max-time 10 "$EXTERNAL_URL" > /dev/null 2>&1; then
    log_success "외부 접속 확인 완료"
else
    log_warning "외부 접속 확인 실패. DNS 또는 방화벽을 확인해주세요."
fi

# 8. 완료 및 정보 표시
log_header "8. 재기동 완료"

echo ""
log_success "🎉 도배맨 서버 재기동이 완료되었습니다!"
echo ""
echo "📊 서비스 정보:"
echo "   - PM2 상태: pm2 status"
echo "   - 로그 확인: pm2 logs doberman"
echo "   - 모니터링: pm2 monit"
echo "   - 헬스체크: curl http://localhost:3000/api/health"
echo "   - 외부 접속: https://www.doberman.kr"
echo ""
echo "📁 백업 정보:"
echo "   - 백업 위치: $BACKUP_DIR"
echo "   - 롤백 방법: 백업된 설정 파일들을 복원"
echo ""
echo "🔍 모니터링 로그:"
echo "   - 모니터링 로그: tail -f /var/log/doberman-monitoring.log"
echo "   - 에러 로그: tail -f /var/log/doberman-monitoring-error.log"
echo ""
echo "🚨 문제 발생 시:"
echo "   1. pm2 restart doberman"
echo "   2. ./monitoring-script.sh once"
echo "   3. sudo systemctl reload nginx"
echo ""

# 최종 상태 요약
log_info "최종 상태 요약:"
echo "   ✅ PM2 프로세스: $(pm2 list | grep doberman | wc -l)개 실행 중"
echo "   ✅ Nginx 설정: 최적화된 설정 적용"
echo "   ✅ 모니터링: 백그라운드 실행 중"
echo "   ✅ 백업: $BACKUP_DIR에 저장됨"

log_success "모든 작업이 완료되었습니다! 🚀" 