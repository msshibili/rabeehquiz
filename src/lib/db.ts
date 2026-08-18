import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  let client: PrismaClient;

  // Option 1: If cloud database URL (Turso, Postgres, Supabase, Neon) is set in env
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    client = new PrismaClient();
  } else {
    // Option 2: SQLite database with Vercel writable /tmp fallback
    let dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      const tmpPath = "/tmp/dev.db";
      try {
        if (!fs.existsSync(tmpPath)) {
          if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, tmpPath);
          }
        }
        dbPath = tmpPath;
      } catch (err) {
        console.error("Vercel /tmp copy error:", err);
      }
    }

    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    client = new PrismaClient({ adapter });
  }

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const db = getPrismaClient();
