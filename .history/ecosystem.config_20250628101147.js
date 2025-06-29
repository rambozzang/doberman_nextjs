module.exports = {
  apps: [
    {
      name: 'doberman',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/doberman-deploy',
      instances: 1,
      exec_mode: 'fork',
      
      // 메모리 관리
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // 환경 변수
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Next.js 최적화 옵션
        NEXT_TELEMETRY_DISABLED: 1,
        // 메모리 최적화
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      
      // 로그 관리
      log_file: '/var/log/pm2/doberman.log',
      out_file: '/var/log/pm2/doberman-out.log',
      error_file: '/var/log/pm2/doberman-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 자동 재시작 설정
      watch: false,
      ignore_watch: ['node_modules', '.next'],
      
      // 크론 재시작 (매일 새벽 4시)
      cron_restart: '0 4 * * *',
      
      // 헬스체크
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    }
  ]
}; 