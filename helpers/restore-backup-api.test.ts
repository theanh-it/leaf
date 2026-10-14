import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { nnnRouterPlugin } from "elysia-nnn-router";

import { signJWT } from "@be-helpers/auth";
import { acquireBackupOperation } from "@be-helpers/backup-operation";
import restoreMaintenance from "@be-middlewares/restore-maintenance";

const app = new Elysia()
  .onBeforeHandle(restoreMaintenance)
  .use(
    nnnRouterPlugin({
      dir: "routes/api/backups",
      prefix: "/api/backups",
      silent: true,
    })
  )
  .get("/api/probe", () => "probe");

const token = await signJWT({ id: "restore-test-admin", username: "admin" });
const headers = { Authorization: `Bearer ${token}` };

describe("backup restore API", () => {
  test("requires authentication and admin for restore status", async () => {
    const anonymous = await app.handle(
      new Request("http://localhost/api/backups/restore")
    );
    expect(anonymous.status).toBe(401);
    const member = await signJWT({
      id: "restore-test-member",
      username: "member",
    });
    const forbidden = await app.handle(
      new Request("http://localhost/api/backups/restore", {
        headers: { Authorization: `Bearer ${member}` },
      })
    );
    expect(forbidden.status).toBe(422);
    const admin = await app.handle(
      new Request("http://localhost/api/backups/restore", { headers })
    );
    expect(admin.status).toBe(200);
  });

  test("validates two uploaded files without starting a restore", async () => {
    const body = new FormData();
    body.append("requestId", crypto.randomUUID());
    body.append("database", new File(["invalid"], "database.txt"));
    const result = await app.handle(
      new Request("http://localhost/api/backups/restore", {
        method: "POST",
        headers,
        body,
      })
    );
    expect(result.status).toBe(422);
    const response = await result.json();
    expect(response.status).toBe("validation_error");
    expect(response.result.database).toBe("backups.invalidDatabase");
    expect(response.result.files).toBeDefined();
  });

  test("returns conflict when backup is running", async () => {
    const release = acquireBackupOperation("backup");
    expect(release).not.toBeNull();
    try {
      const body = new FormData();
      body.append("requestId", crypto.randomUUID());
      body.append("database", new File(["PGDMP"], "database.dump"));
      body.append("files", new File(["archive"], "files.tar.gz"));
      const result = await app.handle(
        new Request("http://localhost/api/backups/restore", {
          method: "POST",
          headers,
          body,
        })
      );
      expect(result.status).toBe(409);
      expect((await result.json()).message).toBe("backups.operationBusy");
    } finally {
      release?.();
    }
  });

  test("maintenance blocks other API routes while keeping status accessible", async () => {
    const release = acquireBackupOperation("restore");
    expect(release).not.toBeNull();
    try {
      const blocked = await app.handle(
        new Request("http://localhost/api/probe", { headers })
      );
      expect(blocked.status).toBe(503);
      expect(blocked.headers.get("Retry-After")).toBe("5");
      const list = await app.handle(
        new Request("http://localhost/api/backups", { headers })
      );
      expect(list.status).toBe(503);
      const status = await app.handle(
        new Request("http://localhost/api/backups/restore", { headers })
      );
      expect(status.status).toBe(200);
    } finally {
      release?.();
    }
  });
});
