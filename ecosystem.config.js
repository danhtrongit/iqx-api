module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/src/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3130
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3130
    }
  }]
};