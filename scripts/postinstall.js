// scripts/postinstall.js
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const { execSync } = require("child_process");

try {
  console.log("Running prisma generate with DATABASE_URL fallback...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (err) {
  console.error("Prisma generate failed in postinstall:", err);
  // Don't fail install if generate fails in dry-run environments
}
