/** Source: routes/api/auth/register/_middleware.ts */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Rate limit route đăng ký")) {
  const api = await import("@/tests/support/api-context");
  const { app } = api;
  describe("Rate limit route đăng ký", () => {
    test("registration blocks the sixth request even with rotating spoofed IP headers", async () => {
      for (let index = 0; index < 6; index += 1) {
        const response = await app.handle(
          new Request("http://localhost/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Forwarded-For": `198.51.100.${index}`,
              "X-Real-IP": `198.51.100.${index}`,
            },
            body: "{}",
          })
        );
        expect(response.status).toBe(index < 5 ? 422 : 429);
        if (index === 5)
          expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(
            0
          );
      }
    });
  });
}
