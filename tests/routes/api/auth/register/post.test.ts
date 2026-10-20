/** POST /api/auth/register: validation, hash mật khẩu, role mặc định và trùng username đồng thời. */
import { describe, expect, test } from "bun:test";
import { comparePassword } from "@/helpers/password";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Đăng ký")) {
  const api = await import("@/tests/support/api-context");
  const { publicRequest, password, prisma } = api;

  describe("Đăng ký", () => {
    test("registration parses input, hashes passwords and prevents role injection", async () => {
      const response = await publicRequest("register", {
        username: " new-user ",
        password,
        fullname: " New User ",
        type: "admin",
        status: "active",
        extra: true,
      });
      expect(response.status).toBe(201);
      const { result } = await response.json();
      expect(result).toMatchObject({
        username: "new-user",
        fullname: "New User",
        type: "customer",
        status: "pending",
      });
      expect(result.password).toBeUndefined();
      const user = await prisma.user.findUniqueOrThrow({
        where: { username: "new-user" },
      });
      expect(user.password).not.toBe(password);
      expect(await comparePassword(password, user.password)).toBe(true);
    });

    test("registration rejects blanks, short/oversized and Unicode byte-truncated passwords", async () => {
      for (const body of [
        null,
        {},
        { username: "  ", password, fullname: "Name" },
        { username: "valid", password: "short", fullname: "Name" },
        { username: "valid", password: "a".repeat(73), fullname: "Name" },
        { username: "valid", password: "🔥".repeat(19), fullname: "Name" },
      ]) {
        expect((await publicRequest("register", body)).status).toBe(422);
      }
      expect(await prisma.user.count()).toBe(2);
    });

    test("concurrent registrations return a field error for the duplicate", async () => {
      const body = { username: "duplicate", password, fullname: "Name" };
      const responses = await Promise.all([
        publicRequest("register", body),
        publicRequest("register", body),
      ]);
      expect(responses.map((response) => response.status).sort()).toEqual([
        201, 422,
      ]);
      const duplicate = responses.find((response) => response.status === 422)!;
      expect((await duplicate.json()).result).toEqual({
        username: "users.usernameAlreadyExists",
      });
    });
  });
}
