import { beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";
import { signJWT } from "@be-helpers/auth";
import restoreMaintenance from "@be-middlewares/restore-maintenance";
import { assertTestDatabase } from "@/tests/support/postgres";

const { prisma, disconnectDatabase } = await import("@/database");
assertTestDatabase();

export const app = new Elysia()
  .onBeforeHandle(restoreMaintenance)
  .use(
    nnnRouterPlugin({
      dir: "routes/api/backups",
      prefix: "/api/backups",
      silent: true,
    })
  )
  .get("/api/probe", () => "probe");

const token = await signJWT({
  id: "00000000-0000-4000-8000-000000000001",
  username: "admin",
});
export const headers = { Authorization: `Bearer ${token}` };

beforeAll(async () => {
  await prisma.user.createMany({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        username: "admin",
        password: "unused",
        type: "admin",
        status: "active",
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        username: "member",
        password: "unused",
        type: "customer",
        status: "active",
      },
    ],
  });
});
afterAll(disconnectDatabase);
