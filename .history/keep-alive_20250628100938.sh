#!/bin/bash

# Next.js Keep Alive Script
# 5분마다 사이트를 호출하여 서버를 활성 상태로 유지

SITE_URL="https://www.doberman.kr"
LOG_FILE="/var/log/doberman-keepalive.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 사이트 호출
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "[$TIMESTAMP] Keep-alive successful - HTTP $RESPONSE" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] Keep-alive failed - HTTP $RESPONSE" >> "$LOG_FILE"
    fi
    
    # 5분 대기
    sleep 300
done 