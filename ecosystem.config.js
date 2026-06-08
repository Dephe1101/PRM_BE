module.exports = {
  apps: [
    {
      name: "japanese-edtech-be",
      script: "dist/server.js",
      instances: "max", // Chạy tối đa số lượng Core CPU (Cluster mode)
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Khởi động lại nếu ngốn quá 1GB RAM
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true
    }
  ]
};
