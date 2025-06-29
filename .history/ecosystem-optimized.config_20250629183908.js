module.exports = {
  apps: [
    {
      name: 'doberman',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/doberman-deploy',
      
      // 클러스터 모드로 변경하여 안정성 향상
      instances: 2, // CPU 코어 수에 따라 조정 가능
      exec_mode: 'cluster',
      
      // 메모리 관리 최적화
      max_memory_restart: '2G', // 메모리 제한 증가
      min_uptime: '30s', // 최소 가동 시간 증가
      max_restarts: 5, // 재시작 횟수 제한
      
      // 환경 변수 최적화
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        
        // Next.js 최적화
        NEXT_TELEMETRY_DISABLED: 1,
        
        // Node.js 메모리 최적화
        NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size',
        
        // 성능 최적화
        UV_THREADPOOL_SIZE: 8, // I/O 스레드 풀 크기 증가
      },
      
      // 로그 관리 (상대 경로로 변경)
      log_file: './logs/doberman.log',
      out_file: './logs/doberman-out.log',
      error_file: './logs/doberman-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      
      // 자동 재시작 설정
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      
      // 크론 재시작 제거 (안정성을 위해)
      // cron_restart: '0 4 * * *',
      
      // 헬스체크 강화
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      
      // 재시작 지연 설정
      restart_delay: 4000,
      
      // 종료 시 graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // 에러 처리
      error_file: './logs/doberman-error.log',
      combine_logs: true,
      
      // 자동 덤프 설정
      pmx: true,
      
      // 모니터링 설정
      monitoring: false, // 성능을 위해 비활성화
      
      // 인스턴스 간 로드 밸런싱
      instance_var: 'INSTANCE_ID',
      
      // 프로세스 제목
      name: 'doberman-nextjs',
    }
  ],
  
  // 배포 설정
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-repo-url',
      path: '/path/to/doberman-deploy',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem-optimized.config.js --env production',
      'pre-setup': 'apt update && apt install nodejs npm -y'
    }
  }
}; 