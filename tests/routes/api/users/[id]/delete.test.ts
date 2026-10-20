/** Source: routes/api/users/[id]/delete.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "DELETE /api/users/:id")) {
  const api = await import("@/tests/support/api-context");
  const { request, adminId, memberId } = api;

  describe("DELETE /api/users/:id", () => {
    test("deletes a user so it can no longer be fetched", async () => {
      expect(
        (await request(`users/${memberId}`, api.adminToken, "DELETE")).status
      ).toBe(200);
      expect((await request(`users/${memberId}`, api.adminToken)).status).toBe(
        404
      );
    });

    test("rejects self-deletion and malformed IDs", async () => {
      expect(
        (await request(`users/${adminId}`, api.adminToken, "DELETE")).status
      ).toBe(422);
      expect(
        (await request("users/not-a-uuid", api.adminToken, "DELETE")).status
      ).toBe(422);
    });
  });
}
