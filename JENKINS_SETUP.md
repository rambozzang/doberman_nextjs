# Jenkins 자동 배포 설정 가이드

## 📋 개요

이 문서는 도배맨 프로젝트의 Jenkins 자동 배포 설정 방법을 안내합니다.

## 🛠 사전 요구사항

### 서버 환경

- Ubuntu 20.04 LTS 이상
- Node.js 18.x 이상
- PM2 (자동 설치됨)
- Nginx (선택사항)
- Git

### Jenkins 플러그인

```bash
# 필수 플러그인 목록
- Pipeline
- Git
- NodeJS
- Slack Notification (선택사항)
- Email Extension (선택사항)
```

## 🚀 Jenkins 설정

### 1. Jenkins 설치

```bash
# Java 설치
sudo apt update
sudo apt install openjdk-11-jdk -y

# Jenkins 설치
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins -y

# Jenkins 시작
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 초기 비밀번호 확인
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 2. Node.js 플러그인 설정

1. Jenkins 관리 → Global Tool Configuration
2. NodeJS installations 추가
   - Name: `Node18`
   - Version: `NodeJS 18.x.x`
   - Global npm packages to install: `pm2`

### 3. 환경 변수 설정

Jenkins 관리 → Configure System → Global properties → Environment variables

```bash
# 필수 환경 변수
NODE_ENV=production
PM2_APP_NAME=doberman
DEPLOY_PATH=/var/www/doberman
BACKUP_PATH=/var/backups/doberman

# 선택사항 (알림 설정)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ADMIN_EMAIL=admin@yourdomain.com
```

## 📦 프로젝트 설정

### 1. Pipeline Job 생성

1. Jenkins 대시보드 → New Item
2. 이름: `doberman-deploy`
3. Pipeline 선택 → OK

### 2. Pipeline 설정

**General 탭:**

- ✅ GitHub project
- Project url: `https://github.com/your-username/doberman`

**Build Triggers 탭:**

- ✅ GitHub hook trigger for GITScm polling (자동 배포용)
- ✅ Poll SCM: `H/5 * * * *` (5분마다 체크)

**Pipeline 탭:**

- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/your-username/doberman.git`
- Credentials: GitHub 인증 정보
- Branch Specifier: `*/main` (또는 원하는 브랜치)
- Script Path: `Jenkinsfile`

### 3. 서버 권한 설정

```bash
# Jenkins 사용자를 sudo 그룹에 추가
sudo usermod -aG sudo jenkins

# 비밀번호 없이 sudo 실행 허용 (보안상 주의)
sudo visudo
# 다음 줄 추가:
jenkins ALL=(ALL) NOPASSWD: ALL

# 또는 특정 명령만 허용
jenkins ALL=(ALL) NOPASSWD: /bin/mkdir, /bin/cp, /bin/mv, /bin/rm, /bin/chown, /bin/chmod, /usr/bin/systemctl

# 배포 디렉토리 생성 및 권한 설정
sudo mkdir -p /var/www/doberman
sudo mkdir -p /var/backups/doberman
sudo chown -R jenkins:jenkins /var/www/doberman
sudo chown -R jenkins:jenkins /var/backups/doberman
```

## 🔧 배포 스크립트 권한 설정

```bash
# 스크립트 실행 권한 부여
chmod +x jenkins-deploy.sh
chmod +x build-deploy.sh
chmod +x health-check.sh
```

## 🌐 Webhook 설정 (GitHub)

### 1. GitHub Repository 설정

1. Repository → Settings → Webhooks
2. Add webhook
   - Payload URL: `http://your-jenkins-server:8080/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event`
   - Active: ✅

### 2. Jenkins Security 설정

Jenkins 관리 → Configure Global Security

- ✅ Enable security
- Security Realm: Jenkins' own user database
- Authorization: Logged-in users can do anything
- ✅ Allow anonymous read access (webhook용)

## 📊 배포 환경별 설정

### Development 환경

```bash
# 브랜치: develop
# 포트: 3001
# 자동 배포: 활성화
# 백업: 비활성화
```

### Staging 환경

```bash
# 브랜치: staging
# 포트: 3002
# 자동 배포: 수동 승인
# 백업: 3일 보관
```

### Production 환경

```bash
# 브랜치: main
# 포트: 3000
# 자동 배포: 수동 승인
# 백업: 7일 보관
```

## 🚨 알림 설정

### Slack 알림 설정

1. Jenkins 관리 → Configure System
2. Slack 섹션에서:
   - Workspace: 팀 워크스페이스
   - Credential: Slack Token
   - Default channel: `#deployments`

### 이메일 알림 설정

1. Jenkins 관리 → Configure System
2. Extended E-mail Notification:
   - SMTP server: `smtp.gmail.com`
   - SMTP Port: `587`
   - Credentials: 이메일 인증 정보

## 🔍 모니터링 및 로그

### 로그 파일 위치

```bash
# Jenkins 로그
/var/log/jenkins/jenkins.log

# 배포 로그
/var/log/doberman-deploy.log

# PM2 로그
pm2 logs doberman

# Nginx 로그 (사용시)
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### 모니터링 명령어

```bash
# PM2 프로세스 상태 확인
pm2 list
pm2 show doberman
pm2 monit

# 시스템 리소스 확인
htop
df -h
free -h

# 서비스 상태 확인
sudo systemctl status jenkins
sudo systemctl status nginx
```

## 🛠 문제 해결

### 일반적인 문제들

#### 1. Permission Denied 오류

```bash
# 권한 확인 및 수정
sudo chown -R jenkins:jenkins /var/www/doberman
sudo chmod +x /path/to/script.sh
```

#### 2. PM2 명령어 찾을 수 없음

```bash
# PM2 전역 설치
sudo npm install -g pm2

# PATH 환경 변수 확인
echo $PATH
which pm2
```

#### 3. 헬스체크 실패

```bash
# 서비스 상태 확인
curl -I http://localhost:3000/api/health
pm2 logs doberman --lines 50

# 포트 사용 확인
sudo netstat -tlnp | grep 3000
```

#### 4. 빌드 실패

```bash
# Node.js 버전 확인
node --version
npm --version

# 캐시 정리
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📋 배포 체크리스트

### 배포 전 확인사항

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 (필요시)
- [ ] 서버 리소스 확인

### 배포 후 확인사항

- [ ] 헬스체크 통과
- [ ] PM2 프로세스 정상 실행
- [ ] 로그 오류 없음
- [ ] 주요 기능 동작 확인
- [ ] 성능 모니터링

## 🔄 롤백 절차

### 자동 롤백

헬스체크 실패 시 자동으로 이전 버전으로 롤백됩니다.

### 수동 롤백

```bash
# 백업 목록 확인
ls -la /var/backups/doberman/

# 수동 롤백
sudo cp -r /var/backups/doberman/doberman-backup-YYYYMMDD_HHMMSS /var/www/doberman
cd /var/www/doberman
pm2 restart doberman
```

## 📞 지원 및 문의

배포 관련 문제가 발생하면 다음을 확인해주세요:

1. Jenkins 빌드 로그
2. 배포 로그 (`/var/log/doberman-deploy.log`)
3. PM2 로그 (`pm2 logs doberman`)
4. 시스템 리소스 상태

추가 도움이 필요하면 개발팀에 문의하세요.

---

## 📝 참고 자료

- [Jenkins 공식 문서](https://www.jenkins.io/doc/)
- [PM2 공식 문서](https://pm2.keymetrics.io/docs/)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Nginx 설정 가이드](https://nginx.org/en/docs/)

---

**마지막 업데이트:** 2024년 6월 30일
