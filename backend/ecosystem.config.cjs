module.exports = {
  apps: [
    {
      name: "sipat-api",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" },
      time: true,
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      merge_logs: true,
    },
  ],
};
