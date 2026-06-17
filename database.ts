import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;

let isDisconnected = false;

const createPool = () =>
  new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });

/** Shared pool — tránh nhiều query song song dùng chung một pg Client. */
const pool = globalForPrisma.pgPool ?? createPool();
globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

globalForPrisma.prisma = prisma;

export async function disconnectDatabase() {
  if (isDisconnected) return;

  isDisconnected = true;
  await prisma.$disconnect();
  await pool.end();
}
