/** Source: routes/api/backups/restore/post.ts */
import { describe, expect, test } from "bun:test";
import { acquireBackupOperation } from "@be-helpers/backup-operation";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "POST /api/backups/restore")) {
  const api = await import("@/tests/support/backup-api-context");
  const { app, headers } = api;
  describe("POST /api/backups/restore", () => {
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
  });
}
