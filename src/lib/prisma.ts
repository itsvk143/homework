import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Vercel Serverless environment handling for SQLite (copy to writable /tmp)
if (process.env.VERCEL) {
  const currentDbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (currentDbUrl.startsWith("file:")) {
    const tmpDbPath = "/tmp/dev.db";
    const bundledDbPath = path.join(process.cwd(), "dev.db");
    const prismaBundledDbPath = path.join(process.cwd(), "prisma", "dev.db");

    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
        } catch (e) {
          console.warn("Could not copy bundled dev.db to /tmp:", e);
        }
      } else if (fs.existsSync(prismaBundledDbPath)) {
        try {
          fs.copyFileSync(prismaBundledDbPath, tmpDbPath);
        } catch (e) {
          console.warn("Could not copy prisma/dev.db to /tmp:", e);
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
