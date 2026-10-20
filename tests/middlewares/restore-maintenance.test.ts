/** Source: middlewares/restore-maintenance.ts */
import { describe, expect, test } from "bun:test";
import { acquireBackupOperation } from "@be-helpers/backup-operation";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Bảo trì khi restore")) {
  const api = await import("@/tests/support/backup-api-context");
  const { app, headers } = api;
  describe("Bảo trì khi restore", () => {
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
}
