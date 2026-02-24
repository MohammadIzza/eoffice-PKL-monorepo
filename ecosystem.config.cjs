module.exports = {
  apps: [
    {
      name: "backend-tim6",
      cwd: "/home/tim6/eoffice-PKL-monorepo/e-office-api-v2",
      script: "bun",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 20062
      }
    },
    {
      name: "frontend-tim6",
      cwd: "/home/tim6/eoffice-PKL-monorepo/e-office-webapp-v2",
      script: "bun",
      args: "run start -- -p 20061",
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
