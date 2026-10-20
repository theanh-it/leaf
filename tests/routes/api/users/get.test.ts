/** GET /api/users: phân trang, tìm kiếm, lọc và giới hạn query. */
import { describe, expect, test } from "bun:test";
import { isolatedDatabaseTests } from "@/tests/support/isolated-suite";

if (isolatedDatabaseTests(import.meta.path, "Danh sách người dùng")) {
  const api = await import("@/tests/support/api-context");
  const { request, prisma, passwordHash } = api;

  describe("Danh sách người dùng", () => {
    test("paginates and filters on the server without exposing passwords", async () => {
      await prisma.user.createMany({
        data: Array.from({ length: 5 }, (_, index) => ({
          username: `search-user-${index}`,
          fullname: `Match ${index}`,
          email: `match${index}@example.com`,
          password: passwordHash,
          type: "employee",
          status: index < 4 ? "active" : "inactive",
        })),
      });
      const response = await request(
        "users?page=2&limit=2&search=MATCH&type=employee&status=active",
        api.adminToken
      );
      expect(response.status).toBe(200);
      const { result } = await response.json();
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 2,
        totalRecords: 4,
        totalPages: 2,
      });
      expect(
        result.items.every(
          (user: Record<string, unknown>) =>
            user.type === "employee" &&
            user.status === "active" &&
            !("password" in user)
        )
      ).toBe(true);
      const beyondLastPage = await request(
        "users?page=999&limit=2&search=no-match",
        api.adminToken
      );
      expect((await beyondLastPage.json()).result).toEqual({
        items: [],
        pagination: { page: 1, limit: 2, totalRecords: 0, totalPages: 1 },
      });
      for (const query of [
        "limit=101",
        "page=0",
        "page=1.5",
        "type=owner",
        "status=deleted",
      ]) {
        expect((await request(`users?${query}`, api.adminToken)).status).toBe(
          422
        );
      }
    });
  });
}
