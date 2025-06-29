#!/bin/bash

# Jenkins 배포 스크립트
# 사용법: ./jenkins-deploy.sh [environment] [force]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 환경 변수 설정
DEPLOY_ENV=${1:-production}
FORCE_DEPLOY=${2:-false}
PM2_APP_NAME="doberman"
DEPLOY_PATH="/var/www/doberman"
BACKUP_PATH="/var/backups/doberman"
LOG_FILE="/var/log/doberman-deploy.log"

# 로그 디렉토리 생성
sudo mkdir -p $(dirname $LOG_FILE)
sudo touch $LOG_FILE
sudo chmod 666 $LOG_FILE

# 로그 함수 재정의 (파일에도 기록)
log_with_file() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $timestamp - $message" | tee -a $LOG_FILE
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" | tee -a $LOG_FILE
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" | tee -a $LOG_FILE
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a $LOG_FILE
            ;;
    esac
}

# 시작 로그
log_with_file "INFO" "🚀 Jenkins 자동 배포 시작 - 환경: $DEPLOY_ENV"

# 사전 검사
log_with_file "INFO" "🔍 배포 사전 검사를 시작합니다..."

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    log_with_file "ERROR" "Node.js가 설치되어 있지 않습니다."
    exit 1
fi

NODE_VERSION=$(node --version)
log_with_file "INFO" "Node.js 버전: $NODE_VERSION"

# PM2 확인
if ! command -v pm2 &> /dev/null; then
    log_with_file "WARNING" "PM2가 설치되어 있지 않습니다. 설치를 진행합니다..."
    sudo npm install -g pm2
    log_with_file "SUCCESS" "PM2 설치 완료"
fi

# 현재 실행 중인 프로세스 확인
if pm2 list | grep -q "$PM2_APP_NAME"; then
    CURRENT_STATUS=$(pm2 list | grep "$PM2_APP_NAME" | awk '{print $10}')
    log_with_file "INFO" "현재 $PM2_APP_NAME 상태: $CURRENT_STATUS"
else
    log_with_file "INFO" "현재 실행 중인 $PM2_APP_NAME 프로세스가 없습니다."
fi

# 디스크 공간 확인
AVAILABLE_SPACE=$(df -h . | awk 'NR==2{print $4}')
log_with_file "INFO" "사용 가능한 디스크 공간: $AVAILABLE_SPACE"

# 메모리 확인
AVAILABLE_MEMORY=$(free -h | awk 'NR==2{print $7}')
log_with_file "INFO" "사용 가능한 메모리: $AVAILABLE_MEMORY"

# 백업 생성 (프로덕션 환경만)
if [ "$DEPLOY_ENV" = "production" ]; then
    log_with_file "INFO" "💾 프로덕션 환경 백업을 생성합니다..."
    
    # 백업 디렉토리 생성
    sudo mkdir -p $BACKUP_PATH
    
    if [ -d "$DEPLOY_PATH" ]; then
        BACKUP_NAME="doberman-backup-$(date +%Y%m%d_%H%M%S)"
        sudo cp -r $DEPLOY_PATH $BACKUP_PATH/$BACKUP_NAME
        log_with_file "SUCCESS" "백업 생성 완료: $BACKUP_PATH/$BACKUP_NAME"
        
        # 오래된 백업 정리 (7일 이상)
        sudo find $BACKUP_PATH -name "doberman-backup-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
        log_with_file "INFO" "오래된 백업 파일 정리 완료"
    else
        log_with_file "WARNING" "백업할 기존 배포 디렉토리가 없습니다."
    fi
fi

# 배포 디렉토리 준비
log_with_file "INFO" "📂 배포 디렉토리를 준비합니다..."
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

# 기존 파일 임시 백업
if [ -d "$DEPLOY_PATH" ] && [ "$(ls -A $DEPLOY_PATH)" ]; then
    sudo rm -rf ${DEPLOY_PATH}.old
    sudo mv $DEPLOY_PATH ${DEPLOY_PATH}.old
    sudo mkdir -p $DEPLOY_PATH
    sudo chown -R $USER:$USER $DEPLOY_PATH
    log_with_file "INFO" "기존 파일을 임시 백업했습니다."
fi

# 새 배포 파일 복사
if [ -d "doberman-deploy" ]; then
    log_with_file "INFO" "📋 새 파일을 배포 디렉토리로 복사합니다..."
    sudo cp -r doberman-deploy/* $DEPLOY_PATH/
    sudo chown -R $USER:$USER $DEPLOY_PATH
    sudo chmod +x $DEPLOY_PATH/*.sh 2>/dev/null || true
    log_with_file "SUCCESS" "파일 복사 완료"
else
    log_with_file "ERROR" "배포 파일 디렉토리(doberman-deploy)를 찾을 수 없습니다."
    exit 1
fi

# 배포 디렉토리로 이동
cd $DEPLOY_PATH

# 프로덕션 의존성 설치
log_with_file "INFO" "📦 프로덕션 의존성을 설치합니다..."
if npm ci --only=production; then
    log_with_file "SUCCESS" "의존성 설치 완료"
else
    log_with_file "ERROR" "의존성 설치 실패"
    exit 1
fi

# PM2 프로세스 관리
log_with_file "INFO" "🔄 PM2 프로세스를 관리합니다..."

# 기존 프로세스 처리
if pm2 list | grep -q "$PM2_APP_NAME"; then
    if [ "$FORCE_DEPLOY" = "true" ]; then
        log_with_file "WARNING" "강제 배포 모드: 기존 프로세스를 강제 종료합니다..."
        pm2 delete $PM2_APP_NAME || true
    else
        log_with_file "INFO" "기존 프로세스를 우아하게 재시작합니다..."
        if ! pm2 gracefulReload $PM2_APP_NAME; then
            log_with_file "WARNING" "우아한 재시작 실패. 일반 재시작을 시도합니다..."
            if ! pm2 restart $PM2_APP_NAME; then
                log_with_file "WARNING" "재시작 실패. 프로세스를 삭제하고 새로 시작합니다..."
                pm2 delete $PM2_APP_NAME || true
            else
                log_with_file "SUCCESS" "프로세스 재시작 완료"
            fi
        else
            log_with_file "SUCCESS" "프로세스 우아한 재시작 완료"
        fi
    fi
fi

# 새 프로세스 시작
if ! pm2 list | grep -q "$PM2_APP_NAME"; then
    log_with_file "INFO" "🚀 새 프로세스를 시작합니다..."
    
    if [ -f "ecosystem-optimized.config.js" ]; then
        log_with_file "INFO" "최적화된 PM2 설정을 사용합니다..."
        pm2 start ecosystem-optimized.config.js --env $DEPLOY_ENV
    elif [ -f "ecosystem.config.js" ]; then
        log_with_file "INFO" "기본 PM2 설정을 사용합니다..."
        pm2 start ecosystem.config.js --env $DEPLOY_ENV
    else
        log_with_file "WARNING" "PM2 설정 파일이 없습니다. 기본 설정으로 시작합니다..."
        pm2 start npm --name "$PM2_APP_NAME" -- start
    fi
    
    log_with_file "SUCCESS" "새 프로세스 시작 완료"
fi

# PM2 설정 저장
pm2 save
log_with_file "INFO" "PM2 설정 저장 완료"

# 프로세스 상태 확인
sleep 5
PM2_STATUS=$(pm2 list | grep "$PM2_APP_NAME" | awk '{print $10}')
log_with_file "INFO" "현재 프로세스 상태: $PM2_STATUS"

# 헬스체크
log_with_file "INFO" "🏥 서버 헬스체크를 시작합니다..."
HEALTH_CHECK_URL="http://localhost:3000/api/health"
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_CHECK_PASSED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$HEALTH_CHECK_PASSED" = false ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_with_file "SUCCESS" "헬스체크 성공 (HTTP $HTTP_CODE)"
        HEALTH_CHECK_PASSED=true
    else
        log_with_file "WARNING" "헬스체크 실패 (HTTP $HTTP_CODE). 재시도 $RETRY_COUNT/$MAX_RETRIES"
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            sleep 10
        fi
    fi
done

# 헬스체크 결과 처리
if [ "$HEALTH_CHECK_PASSED" = false ]; then
    log_with_file "ERROR" "헬스체크에 실패했습니다. 롤백을 시도합니다..."
    
    # 실패한 프로세스 중지
    pm2 stop $PM2_APP_NAME || true
    pm2 delete $PM2_APP_NAME || true
    
    # 롤백
    if [ -d "${DEPLOY_PATH}.old" ]; then
        log_with_file "INFO" "이전 버전으로 롤백합니다..."
        sudo rm -rf $DEPLOY_PATH
        sudo mv ${DEPLOY_PATH}.old $DEPLOY_PATH
        
        cd $DEPLOY_PATH
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js --env $DEPLOY_ENV
        else
            pm2 start npm --name "$PM2_APP_NAME" -- start
        fi
        pm2 save
        
        log_with_file "SUCCESS" "롤백 완료"
    else
        log_with_file "ERROR" "롤백할 이전 버전이 없습니다."
    fi
    
    exit 1
fi

# 배포 성공 후 정리
log_with_file "INFO" "🧹 배포 후 정리 작업을 시작합니다..."

# 임시 백업 파일 정리
if [ -d "${DEPLOY_PATH}.old" ]; then
    sudo rm -rf ${DEPLOY_PATH}.old
    log_with_file "INFO" "임시 백업 파일 정리 완료"
fi

# 최종 상태 확인
log_with_file "INFO" "📊 최종 배포 상태를 확인합니다..."
pm2 list
pm2 show $PM2_APP_NAME

# 로그 출력
log_with_file "INFO" "📋 최근 애플리케이션 로그:"
pm2 logs $PM2_APP_NAME --lines 10 --nostream

# 시스템 리소스 상태
log_with_file "INFO" "💻 시스템 리소스 상태:"
echo "메모리 사용량:" | tee -a $LOG_FILE
free -h | tee -a $LOG_FILE
echo "디스크 사용량:" | tee -a $LOG_FILE
df -h | tee -a $LOG_FILE

# 배포 완료
log_with_file "SUCCESS" "🎉 Jenkins 자동 배포가 성공적으로 완료되었습니다!"
log_with_file "INFO" "배포 환경: $DEPLOY_ENV"
log_with_file "INFO" "배포 시간: $(date)"
log_with_file "INFO" "로그 파일: $LOG_FILE"

exit 0 