pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        PM2_APP_NAME = 'doberman'
        DEPLOY_PATH = '/var/www/doberman'
        BACKUP_PATH = '/var/backups/doberman'
        NGINX_CONFIG_PATH = '/etc/nginx/sites-available/doberman'
    }
    
    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['production', 'staging', 'development'],
            description: '배포 환경을 선택하세요'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: '테스트를 건너뛸지 선택하세요'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: '강제 배포 (기존 프로세스 강제 종료)'
        )
    }
    
    stages {
        stage('환경 정보 출력') {
            steps {
                script {
                    echo "🚀 도배맨 프로젝트 자동 배포 시작"
                    echo "📦 배포 환경: ${params.DEPLOY_ENV}"
                    echo "🔧 Node.js 버전: ${NODE_VERSION}"
                    echo "📂 배포 경로: ${DEPLOY_PATH}"
                    echo "⏰ 배포 시간: ${new Date()}"
                }
            }
        }
        
        stage('코드 체크아웃') {
            steps {
                echo '📥 소스 코드를 체크아웃합니다...'
                checkout scm
                
                script {
                    // Git 정보 출력
                    def gitCommit = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    def gitBranch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    def gitAuthor = sh(returnStdout: true, script: 'git log -1 --pretty=format:"%an"').trim()
                    
                    echo "🔗 Git 브랜치: ${gitBranch}"
                    echo "📝 커밋 해시: ${gitCommit}"
                    echo "👤 커밋 작성자: ${gitAuthor}"
                }
            }
        }
        
        stage('Node.js 환경 설정') {
            steps {
                echo '🔧 Node.js 환경을 설정합니다...'
                sh '''
                    # Node.js 버전 확인
                    node --version
                    npm --version
                    
                    # 캐시 정리
                    npm cache clean --force
                '''
            }
        }
        
        stage('의존성 설치') {
            steps {
                echo '📦 의존성을 설치합니다...'
                sh '''
                    # package-lock.json 기반으로 정확한 의존성 설치
                    npm ci
                '''
            }
        }
        
        stage('린트 검사') {
            steps {
                echo '🔍 코드 품질을 검사합니다...'
                sh '''
                    npm run lint
                '''
            }
            post {
                failure {
                    echo '❌ 린트 검사에 실패했습니다. 코드를 확인해주세요.'
                }
            }
        }
        
        stage('테스트 실행') {
            when {
                not { params.SKIP_TESTS }
            }
            steps {
                echo '🧪 테스트를 실행합니다...'
                script {
                    try {
                        sh '''
                            # 테스트가 있다면 실행
                            if [ -f "jest.config.js" ] || grep -q "test" package.json; then
                                npm test
                            else
                                echo "⚠️  테스트 설정이 없습니다. 건너뜁니다."
                            fi
                        '''
                    } catch (Exception e) {
                        echo "⚠️  테스트 실행 중 오류가 발생했지만 계속 진행합니다: ${e.getMessage()}"
                    }
                }
            }
        }
        
        stage('프로젝트 빌드') {
            steps {
                echo '🔨 프로젝트를 빌드합니다...'
                sh '''
                    # 기존 빌드 파일 정리
                    rm -rf .next
                    rm -rf out
                    
                    # Next.js 빌드
                    npm run build
                '''
            }
            post {
                failure {
                    echo '❌ 빌드에 실패했습니다.'
                }
                success {
                    echo '✅ 빌드가 성공적으로 완료되었습니다.'
                }
            }
        }
        
        stage('배포 패키지 생성') {
            steps {
                echo '📦 배포 패키지를 생성합니다...'
                sh '''
                    # 기존 배포 디렉토리 정리
                    rm -rf doberman-deploy
                    rm -f doberman.tar.gz
                    
                    # 배포 스크립트 실행
                    chmod +x build-deploy.sh
                    ./build-deploy.sh
                '''
            }
        }
        
        stage('서버 백업') {
            when {
                environment name: 'DEPLOY_ENV', value: 'production'
            }
            steps {
                echo '💾 현재 운영 서버를 백업합니다...'
                sh '''
                    # 백업 디렉토리 생성
                    sudo mkdir -p ${BACKUP_PATH}
                    
                    # 현재 배포된 버전 백업
                    if [ -d "${DEPLOY_PATH}" ]; then
                        BACKUP_NAME="doberman-backup-$(date +%Y%m%d_%H%M%S)"
                        sudo cp -r ${DEPLOY_PATH} ${BACKUP_PATH}/${BACKUP_NAME}
                        echo "✅ 백업 완료: ${BACKUP_PATH}/${BACKUP_NAME}"
                        
                        # 오래된 백업 파일 정리 (7일 이상된 백업 삭제)
                        sudo find ${BACKUP_PATH} -name "doberman-backup-*" -mtime +7 -exec rm -rf {} \\;
                    else
                        echo "⚠️  기존 배포 디렉토리가 없습니다. 백업을 건너뜁니다."
                    fi
                '''
            }
        }
        
        stage('서버 배포') {
            steps {
                echo '🚀 서버에 배포합니다...'
                script {
                    sh '''
                        # 배포 디렉토리 권한 설정
                        sudo mkdir -p ${DEPLOY_PATH}
                        sudo chown -R $USER:$USER ${DEPLOY_PATH}
                        
                        # 기존 파일 백업 후 새 파일 복사
                        if [ -d "${DEPLOY_PATH}" ]; then
                            sudo rm -rf ${DEPLOY_PATH}.old
                            sudo mv ${DEPLOY_PATH} ${DEPLOY_PATH}.old
                        fi
                        
                        # 새 배포 파일 복사
                        sudo cp -r doberman-deploy ${DEPLOY_PATH}
                        sudo chown -R $USER:$USER ${DEPLOY_PATH}
                        
                        # 실행 권한 설정
                        sudo chmod +x ${DEPLOY_PATH}/*.sh
                    '''
                }
            }
        }
        
        stage('PM2 프로세스 관리') {
            steps {
                echo '🔄 PM2 프로세스를 관리합니다...'
                script {
                    sh '''
                        cd ${DEPLOY_PATH}
                        
                        # PM2가 설치되어 있는지 확인
                        if ! command -v pm2 &> /dev/null; then
                            echo "📦 PM2를 설치합니다..."
                            sudo npm install -g pm2
                        fi
                        
                        # 프로덕션 의존성 설치
                        echo "📦 프로덕션 의존성을 설치합니다..."
                        npm ci --only=production
                        
                        # 기존 프로세스 확인 및 중지
                        if pm2 list | grep -q "${PM2_APP_NAME}"; then
                            echo "🛑 기존 프로세스를 중지합니다..."
                            if [ "${params.FORCE_DEPLOY}" = "true" ]; then
                                pm2 delete ${PM2_APP_NAME} || true
                            else
                                pm2 gracefulReload ${PM2_APP_NAME} || pm2 restart ${PM2_APP_NAME} || pm2 delete ${PM2_APP_NAME}
                            fi
                        fi
                        
                        # 새 프로세스 시작
                        echo "🚀 새 프로세스를 시작합니다..."
                        if [ -f "ecosystem-optimized.config.js" ]; then
                            pm2 start ecosystem-optimized.config.js --env ${params.DEPLOY_ENV}
                        else
                            pm2 start ecosystem.config.js --env ${params.DEPLOY_ENV}
                        fi
                        
                        # PM2 설정 저장
                        pm2 save
                        
                        # 프로세스 상태 확인
                        sleep 5
                        pm2 list
                        pm2 logs ${PM2_APP_NAME} --lines 20
                    '''
                }
            }
        }
        
        stage('헬스 체크') {
            steps {
                echo '🏥 서버 상태를 확인합니다...'
                script {
                    def healthCheckPassed = false
                    def maxRetries = 10
                    def retryCount = 0
                    
                    while (!healthCheckPassed && retryCount < maxRetries) {
                        try {
                            sh '''
                                # 헬스체크 URL 호출 (포트 3000 기본값)
                                response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
                                
                                if [ "$response" = "200" ]; then
                                    echo "✅ 헬스체크 성공 (HTTP $response)"
                                    exit 0
                                else
                                    echo "⚠️  헬스체크 실패 (HTTP $response). 재시도 중..."
                                    exit 1
                                fi
                            '''
                            healthCheckPassed = true
                        } catch (Exception e) {
                            retryCount++
                            echo "⚠️  헬스체크 실패 (${retryCount}/${maxRetries}). 10초 후 재시도..."
                            sleep(10)
                        }
                    }
                    
                    if (!healthCheckPassed) {
                        error("❌ 헬스체크에 실패했습니다. 배포를 롤백합니다.")
                    }
                }
            }
            post {
                failure {
                    echo '🔄 헬스체크 실패로 인한 롤백을 시도합니다...'
                    script {
                        try {
                            sh '''
                                # 실패한 프로세스 중지
                                pm2 stop ${PM2_APP_NAME} || true
                                pm2 delete ${PM2_APP_NAME} || true
                                
                                # 이전 버전으로 롤백
                                if [ -d "${DEPLOY_PATH}.old" ]; then
                                    echo "📂 이전 버전으로 롤백합니다..."
                                    sudo rm -rf ${DEPLOY_PATH}
                                    sudo mv ${DEPLOY_PATH}.old ${DEPLOY_PATH}
                                    
                                    cd ${DEPLOY_PATH}
                                    pm2 start ecosystem.config.js --env ${params.DEPLOY_ENV}
                                    pm2 save
                                    
                                    echo "✅ 롤백이 완료되었습니다."
                                else
                                    echo "❌ 롤백할 이전 버전이 없습니다."
                                fi
                            '''
                        } catch (Exception e) {
                            echo "❌ 롤백 중 오류가 발생했습니다: ${e.getMessage()}"
                        }
                    }
                }
            }
        }
        
        stage('Nginx 설정 업데이트') {
            when {
                environment name: 'DEPLOY_ENV', value: 'production'
            }
            steps {
                echo '🌐 Nginx 설정을 업데이트합니다...'
                script {
                    try {
                        sh '''
                            # Nginx 설정 파일이 있는지 확인
                            if [ -f "${DEPLOY_PATH}/nginx-doberman-optimized.conf" ]; then
                                echo "📝 Nginx 설정을 업데이트합니다..."
                                sudo cp ${DEPLOY_PATH}/nginx-doberman-optimized.conf ${NGINX_CONFIG_PATH}
                                
                                # Nginx 설정 테스트
                                sudo nginx -t
                                
                                # Nginx 재로드
                                sudo systemctl reload nginx
                                echo "✅ Nginx 설정이 업데이트되었습니다."
                            else
                                echo "⚠️  Nginx 설정 파일이 없습니다. 건너뜁니다."
                            fi
                        '''
                    } catch (Exception e) {
                        echo "⚠️  Nginx 설정 업데이트 중 오류가 발생했습니다: ${e.getMessage()}"
                    }
                }
            }
        }
        
        stage('정리 작업') {
            steps {
                echo '🧹 임시 파일을 정리합니다...'
                sh '''
                    # 빌드 과정에서 생성된 임시 파일들 정리
                    rm -rf doberman-deploy
                    rm -f doberman.tar.gz
                    
                    # 이전 버전 정리 (성공적으로 배포된 경우)
                    if [ -d "${DEPLOY_PATH}.old" ]; then
                        sudo rm -rf ${DEPLOY_PATH}.old
                    fi
                    
                    echo "✅ 정리 작업이 완료되었습니다."
                '''
            }
        }
    }
    
    post {
        always {
            echo '📊 배포 결과를 정리합니다...'
            script {
                def deployStatus = currentBuild.currentResult
                def deployTime = new Date()
                def gitCommit = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                def gitBranch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                
                echo """
                📋 배포 요약:
                - 상태: ${deployStatus}
                - 환경: ${params.DEPLOY_ENV}
                - 브랜치: ${gitBranch}
                - 커밋: ${gitCommit}
                - 시간: ${deployTime}
                """
            }
        }
        
        success {
            echo '🎉 배포가 성공적으로 완료되었습니다!'
            script {
                // 성공 알림 (Slack, 이메일 등)
                try {
                    sh '''
                        # PM2 상태 최종 확인
                        pm2 list
                        pm2 show ${PM2_APP_NAME}
                    '''
                } catch (Exception e) {
                    echo "⚠️  최종 상태 확인 중 오류: ${e.getMessage()}"
                }
            }
        }
        
        failure {
            echo '❌ 배포에 실패했습니다.'
            script {
                // 실패 알림 및 로그 수집
                try {
                    sh '''
                        echo "📋 PM2 프로세스 상태:"
                        pm2 list || echo "PM2 상태 확인 실패"
                        
                        echo "📋 최근 로그:"
                        pm2 logs ${PM2_APP_NAME} --lines 50 || echo "로그 확인 실패"
                        
                        echo "📋 시스템 리소스:"
                        free -h
                        df -h
                    '''
                } catch (Exception e) {
                    echo "⚠️  실패 정보 수집 중 오류: ${e.getMessage()}"
                }
            }
        }
        
        cleanup {
            echo '🧹 워크스페이스를 정리합니다...'
            cleanWs()
        }
    }
} 