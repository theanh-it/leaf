/** Bản build dist/server.js: auth, lỗi Prisma, phân quyền và ẩn chi tiết lỗi production. */
import { test } from "bun:test";
import assert from "node:assert/strict";

import { hashPassword } from "@/helpers/password";
import { assertTestDatabase } from "@/tests/support/postgres";

import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";
import { runCommand } from "@/tests/support/postgres";

if (
  isolatedDatabaseTests(import.meta.path, "Server production", () =>
    runCommand([process.execPath, "run", "build:be"])
  )
) {
  const { prisma, disconnectDatabase } = await import("@/database");
  test("bản build giữ đúng auth, quyền, lỗi unique và không lộ SQL khi DB lỗi", async () => {
    assertTestDatabase();

    const password = "production-test123";
    await prisma.user.create({
      data: {
        username: "operator",
        password: await hashPassword(password),
        type: "admin",
        status: "active",
      },
    });
    const reservation = Bun.serve({ port: 0, fetch: () => new Response() });
    const port = reservation.port;
    reservation.stop(true);
    const baseUrl = `http://localhost:${port}`;
    const server = Bun.spawn([process.execPath, "run", "dist/server.js"], {
      env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = new Response(server.stdout).text();
    const stderr = new Response(server.stderr).text();

    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        try {
          if ((await fetch(`${baseUrl}/health/ready`)).ok) {
            ready = true;
            break;
          }
        } catch {
          /* Wait for startup. */
        }
        await Bun.sleep(50);
      }
      assert(ready, "Production server did not become ready");
      const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "operator", password }),
      });
      assert.equal(login.status, 200);
      const { result } = await login.json();
      assert.equal(result.user.password, undefined);
      const headers = {
        Authorization: `Bearer ${result.token}`,
        "Content-Type": "application/json",
      };

      const duplicate = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: "operator", password }),
      });
      assert.equal(duplicate.status, 422);
      assert.equal(
        (await duplicate.json()).result.username,
        "users.usernameAlreadyExists"
      );
      const registerDuplicate = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: "operator",
          password,
          fullname: "Duplicate",
        }),
      });
      assert.equal(registerDuplicate.status, 422);
      assert.equal(
        (await registerDuplicate.json()).result.username,
        "users.usernameAlreadyExists"
      );

      const profile = await fetch(`${baseUrl}/api/auth/profile`, { headers });
      assert.equal(profile.status, 200);
      assert.equal((await profile.json()).result.password, undefined);
      const list = await fetch(`${baseUrl}/api/users?page=1&limit=1`, {
        headers,
      });
      assert.equal(list.status, 200);
      assert.equal((await list.json()).result.items.length, 1);

      // Lỗi DB thật phải trả response chuẩn và không lộ SQL/schema ở production.
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME TO "users_unavailable"'
      );
      try {
        const failed = await fetch(`${baseUrl}/api/auth/profile`, { headers });
        assert.equal(failed.status, 500);
        assert.deepEqual(await failed.json(), {
          status: "error",
          message: "server.error",
        });
      } finally {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "users_unavailable" RENAME TO "users"'
        );
      }

      await prisma.user.update({
        where: { username: "operator" },
        data: { type: "customer" },
      });
      assert.equal(
        (await fetch(`${baseUrl}/api/users`, { headers })).status,
        403
      );
      await prisma.user.update({
        where: { username: "operator" },
        data: { status: "inactive" },
      });
      assert.equal(
        (await fetch(`${baseUrl}/api/auth/profile`, { headers })).status,
        401
      );
    } finally {
      server.kill("SIGTERM");
      await server.exited;
      await stdout;
      await stderr;
      await disconnectDatabase();
    }
  }, 15_000);
}
