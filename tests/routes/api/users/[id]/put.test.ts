/** Source: routes/api/users/[id]/put.ts */
import { describe, expect, test } from "bun:test";
import { comparePassword } from "@/helpers/password";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "PUT /api/users/:id")) {
  const api = await import("@/tests/support/api-context");
  const { request, prisma, adminId, memberId } = api;

  describe("PUT /api/users/:id", () => {
    test("updates parsed fields and hashes the replacement password", async () => {
      const response = await request(
        `users/${memberId}`,
        api.adminToken,
        "PUT",
        {
          fullname: " Updated ",
          type: "employee",
          password: "changed123",
        }
      );
      expect(response.status).toBe(200);
      expect((await response.json()).result).toMatchObject({
        fullname: "Updated",
        type: "employee",
      });
      const stored = await prisma.user.findUniqueOrThrow({
        where: { id: memberId },
      });
      expect(await comparePassword("changed123", stored.password)).toBe(true);
    });

    test("rejects malformed IDs and reports duplicate email and phone fields", async () => {
      expect(
        (await request("users/not-a-uuid", api.adminToken, "PUT", {})).status
      ).toBe(422);
      await prisma.user.update({
        where: { id: memberId },
        data: { email: "taken@example.com", phone: "0900000000" },
      });
      for (const [field, value] of [
        ["email", "taken@example.com"],
        ["phone", "0900000000"],
      ] as const) {
        const response = await request(
          `users/${adminId}`,
          api.adminToken,
          "PUT",
          { [field]: value }
        );
        expect(response.status).toBe(422);
        expect((await response.json()).result[field]).toBe(
          `users.${field}AlreadyExists`
        );
      }
    });
  });
}
