/** Source: middlewares/required-login.ts */
import { describe, expect, test } from "bun:test";
import * as jwt from "jsonwebtoken";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (
  isolatedDatabaseTests(import.meta.path, "requiredLogin: tài khoản và JWT")
) {
  const api = await import("@/tests/support/api-context");
  const { request, prisma, adminId, app } = api;
  describe("requiredLogin: tài khoản và JWT", () => {
    test("inactive, pending and deleted accounts cannot reuse old JWTs", async () => {
      for (const status of ["inactive", "pending"]) {
        await prisma.user.update({ where: { id: adminId }, data: { status } });
        expect((await request("auth/profile", api.adminToken)).status).toBe(
          401
        );
      }
      await prisma.user.delete({ where: { id: adminId } });
      expect((await request("users", api.adminToken)).status).toBe(401);
    });

    test("missing, malformed, expired tokens and non-Bearer headers return 401", async () => {
      for (const token of [
        undefined,
        "invalid",
        jwt.sign(
          { id: adminId, username: "operator" },
          process.env.JWT_SECRET!,
          {
            expiresIn: -1,
          }
        ),
        jwt.sign(
          { id: "invalid-id", username: "operator" },
          process.env.JWT_SECRET!
        ),
      ]) {
        expect((await request("auth/profile", token)).status).toBe(401);
      }
      const response = await app.handle(
        new Request("http://localhost/api/auth/profile", {
          headers: { Authorization: `Basic ${api.adminToken}` },
        })
      );
      expect(response.status).toBe(401);
    });
  });
}
