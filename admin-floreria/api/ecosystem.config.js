module.exports = {
  apps: [
    {
      name: "admin-perfumeria-api",
      script: "./src/index.js",
      instances: process.env.NODE_ENV === "production" ? "max" : 1,
      exec_mode: "cluster",

      env: {
        NODE_ENV: "development",
        PORT: 4002,
        PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || "sandbox",
        PAYPHONE_ENVIRONMENT: process.env.PAYPHONE_ENVIRONMENT || "sandbox",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4002,
        PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || "live",
        PAYPHONE_ENVIRONMENT: process.env.PAYPHONE_ENVIRONMENT || "live",
      },

      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      watch: false,
      max_memory_restart: "3G",
      min_uptime: "10s",
      max_restarts: 10,
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
};
