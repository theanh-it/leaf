/** GET /health/ready: DB hoạt động, bảo trì restore và mất kết nối DB. */
import { describe, expect, spyOn, test } from "bun:test";
import { acquireBackupOperation } from "@/helpers/backup-operation";
import { logger } from "@/plugins/logger";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Readiness của máy chủ")) {
  const api = await import("@/tests/support/api-context");
  const { healthApp, disconnectDatabase } = api;

  describe("Readiness của máy chủ", () => {
    test("readiness checks the database and returns 503 during maintenance or database failure", async () => {
      const check = () =>
        healthApp.handle(new Request("http://localhost/health/ready"));
      expect((await check()).status).toBe(200);
      const release = acquireBackupOperation("restore");
      try {
        expect((await check()).status).toBe(503);
      } finally {
        release?.();
      }
      // Terminal check: close the real pool after all database API cases.
      await disconnectDatabase();
      const log = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const unavailable = await check();
        expect(unavailable.status).toBe(503);
        expect(unavailable.headers.get("Cache-Control")).toBe("no-store");
        expect((await unavailable.json()).message).toBe("health.unavailable");
      } finally {
        log.mockRestore();
      }
    });
  });
}
