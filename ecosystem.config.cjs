module.exports = {
  apps: [
    {
      name: "sylvanova",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "350M",
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
