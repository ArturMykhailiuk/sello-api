export default {
  apps: [{
    name: 'sello-backend',
    script: './app.js',
    cwd: '/home/ubuntu/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/ubuntu/logs/sello-backend-error.log',
    out_file: '/home/ubuntu/logs/sello-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
