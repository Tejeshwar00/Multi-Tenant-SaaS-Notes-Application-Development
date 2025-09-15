module.exports = {
  apps: [
    {
      name: 'saas-notes-backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        JWT_SECRET: 'dev-secret-key-change-in-production'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_type: 'json'
    }
  ]
};