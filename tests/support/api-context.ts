import { afterAll, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

import { prisma, disconnectDatabase } from "@/database";
import { hashPassword } from "@/helpers/password";
import { signJWT } from "@/helpers/auth";
import login from "@/routes/api/auth/login/post";
import register from "@/routes/api/auth/register/post";
import { errorHandlerPlugin } from "@/plugins/error-handler";
import readiness from "@/routes/health/ready/get";
import { assertTestDatabase } from "@/tests/support/postgres";

assertTestDatabase();

export const app = new Elysia().use(errorHandlerPlugin()).use(
  nnnRouterPlugin({
    dir: "routes/api",
    prefix: "/api",
    silent: true,
  })
);
// Test handler dùng publicApp; test _middleware.test.ts dùng app với đầy đủ middleware.
export const publicApp = new Elysia()
  .post("/login", login)
  .post("/register", register);
export const healthApp = new Elysia().get("/health/ready", readiness);
export const password = "secret123";
export const passwordHash = await hashPassword(password);
export const adminId = Bun.randomUUIDv7();
export const memberId = Bun.randomUUIDv7();
export let adminToken: string;
export let memberToken: string;

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        username: "operator",
        password: passwordHash,
        type: "admin",
        status: "active",
      },
      {
        id: memberId,
        username: "admin",
        password: passwordHash,
        type: "customer",
        status: "active",
      },
    ],
  });
  adminToken = await signJWT({ id: adminId, username: "old-admin-name" });
  memberToken = await signJWT({ id: memberId, username: "admin" });
});
afterAll(disconnectDatabase);

export async function request(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown
) {
  return app.handle(
    new Request(`http://localhost/api/${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  );
}

export async function publicRequest(path: string, body: unknown) {
  return publicApp.handle(
    new Request(`http://localhost/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export { prisma, disconnectDatabase };
