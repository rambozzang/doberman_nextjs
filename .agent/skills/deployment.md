---
description: Jenkins를 통한 CI/CD 배포 방법
---

# Deployment

## Jenkins 배포
```bash
// turbo
./jenkins-deploy.sh
```

## 수동 배포
```bash
// turbo
./build-deploy.sh
```

## PM2 서버 관리
```bash
# 서버 시작
pm2 start ecosystem.config.js

# 서버 재시작
pm2 restart doberman

# 로그 확인
pm2 logs doberman
```

## 관련 파일
- `Jenkinsfile`: Jenkins 파이프라인 정의
- `ecosystem.config.js`: PM2 설정
- `build-deploy.sh`: 빌드 및 배포 스크립트

## 상세 문서
- `JENKINS_SETUP.md`: Jenkins 설정 가이드
