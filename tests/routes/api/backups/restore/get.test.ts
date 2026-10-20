/** Source: routes/api/backups/restore/get.ts */
import { describe, expect, test } from "bun:test";
import { signJWT } from "@be-helpers/auth";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "GET /api/backups/restore")) {
  const api = await import("@/tests/support/backup-api-context");
  const { app, headers } = api;
  describe("GET /api/backups/restore", () => {
    test("requires authentication and admin for restore status", async () => {
      const anonymous = await app.handle(
        new Request("http://localhost/api/backups/restore")
      );
      expect(anonymous.status).toBe(401);
      const member = await signJWT({
        id: "00000000-0000-4000-8000-000000000002",
        username: "member",
      });
      const forbidden = await app.handle(
        new Request("http://localhost/api/backups/restore", {
          headers: { Authorization: `Bearer ${member}` },
        })
      );
      expect(forbidden.status).toBe(403);
      const admin = await app.handle(
        new Request("http://localhost/api/backups/restore", { headers })
      );
      expect(admin.status).toBe(200);
    });
  });
}
