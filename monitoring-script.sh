#!/bin/bash

# NextJS 서버 모니터링 및 자동 복구 스크립트
# 접속 문제 해결을 위한 종합 모니터링

SITE_URL="https://www.doberman.kr"
HEALTH_URL="https://www.doberman.kr/api/health"
LOG_FILE="./logs/doberman-monitoring.log"
ERROR_LOG="./logs/doberman-monitoring-error.log"
PM2_APP_NAME="doberman-nextjs"

# 로그 함수
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    if [ "$level" = "ERROR" ]; then
        echo "[$timestamp] [$level] $message" >> "$ERROR_LOG"
    fi
}

# 헬스체크 함수
check_health() {
    local url=$1
    local timeout=${2:-10}
    
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" --max-time "$timeout" "$url")
    echo "$response"
}

# PM2 상태 확인
check_pm2_status() {
    pm2 show "$PM2_APP_NAME" > /dev/null 2>&1
    return $?
}

# PM2 재시작 함수
restart_pm2() {
    log_message "INFO" "PM2 재시작 시도: $PM2_APP_NAME"
    pm2 restart "$PM2_APP_NAME" --update-env
    sleep 10
    
    if check_pm2_status; then
        log_message "INFO" "PM2 재시작 성공"
        return 0
    else
        log_message "ERROR" "PM2 재시작 실패"
        return 1
    fi
}

# Nginx 재로드 함수
reload_nginx() {
    log_message "INFO" "Nginx 설정 재로드 시도"
    nginx -t && nginx -s reload
    
    if [ $? -eq 0 ]; then
        log_message "INFO" "Nginx 재로드 성공"
        return 0
    else
        log_message "ERROR" "Nginx 재로드 실패"
        return 1
    fi
}

# 메인 모니터링 함수
monitor_service() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 1. 기본 사이트 체크
    site_response=$(check_health "$SITE_URL" 15)
    site_code=$(echo "$site_response" | cut -d':' -f1)
    site_time=$(echo "$site_response" | cut -d':' -f2)
    
    # 2. 헬스체크 API 체크
    health_response=$(check_health "$HEALTH_URL" 10)
    health_code=$(echo "$health_response" | cut -d':' -f1)
    health_time=$(echo "$health_response" | cut -d':' -f2)
    
    # 3. PM2 상태 체크
    pm2_status="OK"
    if ! check_pm2_status; then
        pm2_status="FAILED"
    fi
    
    # 정상 상태 로깅
    if [ "$site_code" = "200" ] && [ "$health_code" = "200" ] && [ "$pm2_status" = "OK" ]; then
        log_message "INFO" "모든 서비스 정상 - Site: ${site_code}(${site_time}s), Health: ${health_code}(${health_time}s), PM2: ${pm2_status}"
        return 0
    fi
    
    # 문제 상황 처리
    log_message "WARNING" "서비스 문제 감지 - Site: ${site_code}(${site_time}s), Health: ${health_code}(${health_time}s), PM2: ${pm2_status}"
    
    # PM2 문제 처리
    if [ "$pm2_status" = "FAILED" ]; then
        log_message "ERROR" "PM2 프로세스 문제 감지"
        restart_pm2
        sleep 15
        return 1
    fi
    
    # 응답 시간이 너무 느린 경우 (5초 이상)
    if (( $(echo "$site_time > 5.0" | bc -l) )); then
        log_message "WARNING" "응답 시간 지연 감지: ${site_time}s"
    fi
    
    # HTTP 에러 처리
    if [ "$site_code" != "200" ] || [ "$health_code" != "200" ]; then
        log_message "ERROR" "HTTP 에러 감지 - 복구 시도"
        
        # 1차: PM2 재시작
        restart_pm2
        sleep 15
        
        # 재시작 후 재확인
        retry_response=$(check_health "$SITE_URL" 10)
        retry_code=$(echo "$retry_response" | cut -d':' -f1)
        
        if [ "$retry_code" = "200" ]; then
            log_message "INFO" "PM2 재시작으로 문제 해결됨"
            return 0
        fi
        
        # 2차: Nginx 재로드
        reload_nginx
        sleep 10
        
        # 최종 확인
        final_response=$(check_health "$SITE_URL" 10)
        final_code=$(echo "$final_response" | cut -d':' -f1)
        
        if [ "$final_code" = "200" ]; then
            log_message "INFO" "Nginx 재로드로 문제 해결됨"
            return 0
        else
            log_message "ERROR" "자동 복구 실패 - 수동 확인 필요"
            return 1
        fi
    fi
}

# 시스템 리소스 체크
check_system_resources() {
    # 메모리 사용량 체크
    memory_usage=$(free | grep '^Mem:' | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    # 디스크 사용량 체크
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # CPU 로드 체크
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    log_message "INFO" "시스템 리소스 - Memory: ${memory_usage}%, Disk: ${disk_usage}%, Load: ${cpu_load}"
    
    # 메모리 사용량이 90% 이상이면 경고
    if (( $(echo "$memory_usage > 90.0" | bc -l) )); then
        log_message "WARNING" "높은 메모리 사용량: ${memory_usage}%"
    fi
    
    # 디스크 사용량이 85% 이상이면 경고
    if [ "$disk_usage" -gt 85 ]; then
        log_message "WARNING" "높은 디스크 사용량: ${disk_usage}%"
    fi
}

# 메인 실행
main() {
    log_message "INFO" "모니터링 시작"
    
    while true; do
        monitor_service
        check_system_resources
        
        # 2분 대기
        sleep 120
    done
}

# 로그 디렉토리 생성
mkdir -p logs

# 스크립트 시작
if [ "$1" = "start" ]; then
    main &
    echo $! > ./doberman-monitoring.pid
    log_message "INFO" "모니터링 데몬 시작됨 (PID: $!)"
elif [ "$1" = "stop" ]; then
    if [ -f ./doberman-monitoring.pid ]; then
        kill $(cat ./doberman-monitoring.pid)
        rm ./doberman-monitoring.pid
        log_message "INFO" "모니터링 데몬 중지됨"
    fi
elif [ "$1" = "once" ]; then
    monitor_service
    check_system_resources
else
    echo "사용법: $0 {start|stop|once}"
    echo "  start: 백그라운드에서 모니터링 시작"
    echo "  stop:  모니터링 중지"
    echo "  once:  한 번만 체크"
fi 