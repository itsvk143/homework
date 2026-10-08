// scripts/postinstall.js
require("dotenv").config();

const DEFAULT_MONGO_URL = "mongodb+srv://sunnykumarvermakj_db_user:mOiHEYTWi74QIPLV@lvtracker.k4hti6i.mongodb.net/lvtracker?retryWrites=true&w=majority&appName=lvtracker";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MONGODB_URI || DEFAULT_MONGO_URL;
}

const { execSync } = require("child_process");

try {
  console.log("Running prisma generate with MongoDB connection fallback...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (err) {
  console.error("Prisma generate failed in postinstall:", err);
}
