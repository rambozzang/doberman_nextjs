pipeline {
    agent any

    environment {
        DEPLOY_DIR              = '/vdata/www/www.doberman.kr'
        PM2_APP_NAME            = 'doberman'
        // 배포 서버는 Oracle Linux 라 'ubuntu' 계정이 없다. pm2 데몬은 opc 로 돌고 있다.
        // (확인: PM2 v6.0.14 God Daemon (/home/opc/.pm2), 실행 계정 opc)
        DEPLOY_USER             = 'opc'
        DEPLOY_PM2_HOME         = '/home/opc/.pm2'
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
                            --exclude='logs/' \
                            ./ ${DEPLOY_DIR}/

                        sudo install -d -o ${DEPLOY_USER} -g ${DEPLOY_USER} ${DEPLOY_DIR}/logs
                        sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_DIR}/logs

                        # rsync 는 jenkins 로 돌지만 Next.js 런타임은 ${DEPLOY_USER} 로 돈다.
                        # .next/cache 는 런타임이 이미지 최적화 결과를 쓰는 경로라 소유권을 넘겨야 한다.
                        # (안 하면 pm2 error 로그에 EACCES: mkdir '.next/cache/images' 가 계속 쌓인다)
                        sudo install -d -o ${DEPLOY_USER} -g ${DEPLOY_USER} ${DEPLOY_DIR}/.next/cache
                        sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_DIR}/.next/cache
                    """

                    // ── 2. PM2 재시작 ──────────────────────────────────────────
                    // 운영 PM2 계정으로 reload/start하고 online 상태를 확인합니다.
                    sh """
                        set -e

                        if sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 describe ${PM2_APP_NAME} 2>/dev/null | grep -q 'status.*online'; then
                            sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} JENKINS_NODE_COOKIE=dontKillMe pm2 reload ${PM2_APP_NAME} --update-env
                        else
                            sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
                            sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} JENKINS_NODE_COOKIE=dontKillMe pm2 start ${DEPLOY_DIR}/ecosystem.config.js --update-env
                        fi

                        sleep 5

                        if ! sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 describe ${PM2_APP_NAME} 2>/dev/null | grep -q 'status.*online'; then
                            echo 'PM2 앱이 online 상태가 아닙니다.'
                            sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 logs ${PM2_APP_NAME} --lines 50 --nostream || true
                            exit 1
                        fi

                        curl --fail --silent --show-error http://127.0.0.1:3000/api/health > /dev/null
                        sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 save
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
            sh "sudo -iu ${DEPLOY_USER} env PM2_HOME=${DEPLOY_PM2_HOME} pm2 logs ${PM2_APP_NAME} --lines 30 --nostream || true"
        }
    }
}
