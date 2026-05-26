pipeline {
    agent any

    environment {
        DEPLOY_DIR              = '/vdata/www/www.doberman.kr'
        PM2_APP_NAME            = 'doberman'
        NEXT_TELEMETRY_DISABLED = '1'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    stages {

        stage('Build') {
            steps {
                sh 'node --version && npm --version'
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // ── 1. workspace 전체를 배포 디렉토리로 동기화 ─────────────
                    // node_modules 포함 rsync → 배포 서버에서 npm install 불필요
                    sh """
                        mkdir -p ${DEPLOY_DIR}
                        rsync -a --delete \
                            --exclude='.git' \
                            --exclude='docs' \
                            ./ ${DEPLOY_DIR}/
                    """

                    // ── 2. PM2 재시작 ──────────────────────────────────────────
                    // JENKINS_NODE_COOKIE=dontKillMe: 빌드 종료 시 pm2 프로세스 보존
                    sh """
                        if JENKINS_NODE_COOKIE=dontKillMe pm2 describe ${PM2_APP_NAME} > /dev/null 2>&1; then
                            JENKINS_NODE_COOKIE=dontKillMe pm2 reload ${PM2_APP_NAME} --update-env
                        else
                            JENKINS_NODE_COOKIE=dontKillMe pm2 start ${DEPLOY_DIR}/ecosystem.config.js
                            JENKINS_NODE_COOKIE=dontKillMe pm2 save
                        fi
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }

        success {
            echo '✅ 배포 성공!'
        }

        failure {
            echo '❌ 배포 실패 — 로그를 확인하세요'
            sh "pm2 logs ${PM2_APP_NAME} --lines 30 --nostream || true"
        }
    }
}
