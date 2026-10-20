/** Source: middlewares/required-admin.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "requiredAdmin: quyền quản trị")) {
  const api = await import("@/tests/support/api-context");
  const { request, prisma, adminId } = api;
  describe("requiredAdmin: quyền quản trị", () => {
    test("admin access follows role, never username", async () => {
      expect((await request("users", api.adminToken)).status).toBe(200);
      expect((await request("users", api.memberToken)).status).toBe(403);
    });

    test("a role downgrade invalidates admin access with the same JWT", async () => {
      expect((await request("users", api.adminToken)).status).toBe(200);
      await prisma.user.update({
        where: { id: adminId },
        data: { type: "employee" },
      });
      expect((await request("users", api.adminToken)).status).toBe(403);
    });
  });
}
