/** Source: routes/api/auth/login/_middleware.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Rate limit route đăng nhập")) {
  const api = await import("@/tests/support/api-context");
  const { request } = api;
  describe("Rate limit route đăng nhập", () => {
    test("login has its own limiter and blocks the eleventh request", async () => {
      for (let index = 0; index < 11; index += 1) {
        const response = await request("auth/login", undefined, "POST", {});
        expect(response.status).toBe(index < 10 ? 422 : 429);
      }
    });
  });
}
