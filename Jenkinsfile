pipeline {
    agent any

    environment {
        DEPLOY_DIR              = '/vdata/www/www.doberman.kr'
        DEPLOY_USER             = 'opc'
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
                    // 배포 트리 전체를 런타임 계정(${DEPLOY_USER}) 소유로 맞춘다.
                    //
                    // Next.js 런타임은 빌드 산출물을 읽기만 하지 않는다. SSG 페이지가
                    // revalidate 를 쓰므로 ISR 캐시를 아래 경로들에 직접 기록한다.
                    //   .next/cache/fetch-cache/*
                    //   .next/cache/images/*
                    //   .next/server/app/**  (*.html, *.segment.rsc)
                    // 소유자가 jenkins 면 런타임(opc)이 못 써서 EACCES 가 계속 쌓인다.
                    //
                    // 반대로 트리를 opc 소유로 두면 jenkins 가 직접 rsync 할 수 없으므로
                    // rsync 자체를 sudo 로 돌리고 --chown 으로 소유권까지 함께 넘긴다.
                    sh """
                        mkdir -p ${DEPLOY_DIR}
                        sudo rsync -a --delete \
                            --chown=${DEPLOY_USER}:${DEPLOY_USER} \
                            --exclude='.git' \
                            --exclude='docs' \
                            --exclude='logs/' \
                            ./ ${DEPLOY_DIR}/

                        # --chown 은 전송된 파일에만 적용된다. 기존에 다른 소유자로 남아 있는
                        # 파일까지 정리하기 위해 한 번 더 훑는다 (멱등).
                        sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_DIR}

                        sudo install -d -o ${DEPLOY_USER} -g ${DEPLOY_USER} ${DEPLOY_DIR}/logs
                    """

                    // ── 2. systemd가 관리하는 PM2 runtime 재시작 ───────────────
                    // pm2-opc.service는 PID 파일을 사용하는 daemon 방식이 아니라
                    // pm2-runtime foreground 방식으로 두 앱을 함께 관리한다.
                    // Jenkins에서 pm2 CLI를 직접 호출하면 별도 daemon이 생겨
                    // 포트 충돌과 이중 기동이 발생할 수 있으므로 systemd만 사용한다.
                    sh """
                        set -e

                        sudo systemctl restart pm2-opc.service

                        for retry in 1 2 3 4 5 6 7 8 9 10; do
                            if sudo systemctl is-active --quiet pm2-opc.service \
                                && curl --fail --silent --show-error http://127.0.0.1:3000/api/health > /dev/null; then
                                break
                            fi
                            if [ "\$retry" = "10" ]; then
                                echo 'PM2 runtime 또는 Doberman health check가 정상화되지 않았습니다.'
                                sudo systemctl status pm2-opc.service --no-pager -l || true
                                sudo journalctl -u pm2-opc.service -n 80 --no-pager || true
                                exit 1
                            fi
                            sleep 2
                        done
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
            sh 'sudo systemctl status pm2-opc.service --no-pager -l || true; sudo journalctl -u pm2-opc.service -n 50 --no-pager || true'
        }
    }
}
