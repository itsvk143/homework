// scripts/build.js
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const { execSync } = require("child_process");

console.log("Preparing database build pipeline with DATABASE_URL:", process.env.DATABASE_URL);

try {
  console.log("1. Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  console.log("2. Synchronizing SQLite database schema...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });

  console.log("3. Seeding demo users and initial assignments...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });

  console.log("4. Seeding Master Book Library (NCERT + JEE/NEET)...");
  execSync("npx tsx prisma/seedMasterBooks.ts", { stdio: "inherit", env: process.env });

  console.log("✅ Database build preparation completed successfully!");
} catch (err) {
  console.error("Database preparation failed:", err);
  process.exit(1);
}
