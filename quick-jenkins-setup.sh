#!/bin/bash

# Jenkins 빠른 설정 스크립트
set -e

echo "🚀 Jenkins 자동 배포 환경 설정을 시작합니다..."

# 권한 설정
echo "📁 디렉토리 및 권한 설정..."
sudo mkdir -p /var/www/doberman
sudo mkdir -p /var/backups/doberman
sudo mkdir -p /var/log

# 스크립트 실행 권한 부여
chmod +x jenkins-deploy.sh
chmod +x build-deploy.sh
chmod +x health-check.sh

# PM2 전역 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2를 설치합니다..."
    sudo npm install -g pm2
fi

echo "✅ Jenkins 환경 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. Jenkins에서 Pipeline Job 생성"
echo "2. GitHub Webhook 설정"
echo "3. 환경 변수 설정"
echo ""
echo "자세한 내용은 JENKINS_SETUP.md를 참고하세요." 