/** Source: routes/api/users/post.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "POST /api/users")) {
  const api = await import("@/tests/support/api-context");
  const { request, password } = api;

  describe("POST /api/users", () => {
    test("creates a user without exposing the hash and normalizes empty email", async () => {
      const response = await request("users", api.adminToken, "POST", {
        username: "created",
        password,
        email: "",
      });
      expect(response.status).toBe(200);
      const { result } = await response.json();
      expect(result.password).toBeUndefined();
      expect(result.email).toBeNull();
      expect(result.type).toBe("customer");
    });

    test("returns a username field error for a duplicate", async () => {
      const response = await request("users", api.adminToken, "POST", {
        username: "operator",
        password,
      });
      expect(response.status).toBe(422);
      expect((await response.json()).result.username).toBe(
        "users.usernameAlreadyExists"
      );
    });
  });
}
