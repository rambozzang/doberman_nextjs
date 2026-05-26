pipeline {
    agent any

    environment {
        DEPLOY_DIR   = '/vdata/www/www.doberman.kr'
        PM2_APP_NAME = 'doberman'
        NEXT_TELEMETRY_DISABLED = '1'
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 15, unit: 'MINUTES')
    }
    
    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    def commit = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    def author = sh(returnStdout: true, script: 'git log -1 --pretty=format:"%an"').trim()
                    echo "🚀 배포 시작 — commit: ${commit} / author: ${author}"
                }
            }
        }

        stage('Install') {
            steps {
                sh 'node --version && npm --version'
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                // ── 1. 빌드 결과물을 배포 디렉토리로 동기화 ──────────────────
                sh """
                    mkdir -p ${DEPLOY_DIR}

                    rsync -a --delete .next/        ${DEPLOY_DIR}/.next/
                    rsync -a --delete public/       ${DEPLOY_DIR}/public/
                    rsync -a \
                        package.json \
                        package-lock.json \
                        next.config.ts \
                        ecosystem.config.js \
                        ${DEPLOY_DIR}/
                """

                // ── 2. 프로덕션 의존성 설치 ──────────────────────────────────
                sh "cd ${DEPLOY_DIR} && npm ci --omit=dev"

                // ── 3. PM2 재시작 (무중단 reload, 없으면 최초 start) ─────────
                sh """
                    if pm2 describe ${PM2_APP_NAME} > /dev/null 2>&1; then
                        pm2 reload ${PM2_APP_NAME} --update-env
                    else
                        pm2 start ${DEPLOY_DIR}/ecosystem.config.js
                        pm2 save
                    fi
                """
            }
        }

        stage('Health Check') {
            steps {
                // pm2 기동 후 앱이 뜰 때까지 최대 30초 대기
                retry(6) {
                    sleep(time: 5, unit: 'SECONDS')
                    sh '''
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
                        echo "HTTP $STATUS"
                        [ "$STATUS" = "200" ] || [ "$STATUS" = "308" ]
                    '''
                }
            }
            post {
                failure {
                    // 헬스체크 실패 시 pm2 로그 출력 후 빌드 실패
                    sh "pm2 logs ${PM2_APP_NAME} --lines 50 --nostream || true"
                }
            }
        }
    }

    post {
        success {
            echo "✅ 배포 성공"
            sh "pm2 list"
        }
        failure {
            echo "❌ 배포 실패 — 로그를 확인하세요"
        }
        cleanup {
            cleanWs()
        }
    }
}
