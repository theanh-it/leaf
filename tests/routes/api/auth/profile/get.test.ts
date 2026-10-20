/** GET /api/auth/profile: dữ liệu hiện tại và không lộ hash mật khẩu. */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Hồ sơ tài khoản")) {
  const api = await import("@/tests/support/api-context");
  const { request, passwordHash } = api;

  describe("Hồ sơ tài khoản", () => {
    test("profile omits password and uses current database values", async () => {
      const response = await request("auth/profile", api.adminToken);
      expect(response.status).toBe(200);
      const { result } = await response.json();
      expect(result.username).toBe("operator");
      expect(result.type).toBe("admin");
      expect(result.password).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain(passwordHash);
    });
  });
}
