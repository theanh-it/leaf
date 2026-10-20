/** Source: routes/api/users/[id]/get.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "GET /api/users/:id")) {
  const api = await import("@/tests/support/api-context");
  const { request, memberId } = api;

  describe("GET /api/users/:id", () => {
    test("returns the user without exposing the password hash", async () => {
      const response = await request(`users/${memberId}`, api.adminToken);
      expect(response.status).toBe(200);
      const { result } = await response.json();
      expect(result.id).toBe(memberId);
      expect(result.password).toBeUndefined();
    });

    test("rejects malformed IDs and reports missing users", async () => {
      expect((await request("users/not-a-uuid", api.adminToken)).status).toBe(
        422
      );
      expect(
        (await request(`users/${Bun.randomUUIDv7()}`, api.adminToken)).status
      ).toBe(404);
    });
  });
}
