/** POST /api/auth/login: validation, sai mật khẩu, tài khoản bị khóa và ghi nhớ đăng nhập. */
import { describe, expect, test } from "bun:test";
import * as jwt from "jsonwebtoken";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Đăng nhập")) {
  const api = await import("@/tests/support/api-context");
  const { publicRequest, password, prisma, adminId } = api;

  describe("Đăng nhập", () => {
    test("login trims input, omits password and honors remember duration", async () => {
      for (const remember of [false, true]) {
        const response = await publicRequest("login", {
          username: " operator ",
          password,
          remember,
        });
        expect(response.status).toBe(200);
        const { result } = await response.json();
        expect(result.user.password).toBeUndefined();
        const decoded = jwt.decode(result.token) as jwt.JwtPayload;
        expect(decoded.exp! - decoded.iat!).toBe(remember ? 604800 : 86400);
      }
    });

    test("login rejects wrong credentials, inactive accounts and invalid input", async () => {
      const wrong = await publicRequest("login", {
        username: "operator",
        password: "wrong",
      });
      const missing = await publicRequest("login", {
        username: "missing",
        password,
      });
      expect(wrong.status).toBe(401);
      expect(await wrong.json()).toEqual(await missing.json());
      await prisma.user.update({
        where: { id: adminId },
        data: { status: "inactive" },
      });
      expect(
        (await publicRequest("login", { username: "operator", password }))
          .status
      ).toBe(403);
      expect(
        (
          await publicRequest("login", {
            username: "",
            password: "",
            remember: "true",
          })
        ).status
      ).toBe(422);
    });
  });
}
