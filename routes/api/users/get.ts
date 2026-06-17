import type { Context } from "elysia";

import { prisma } from "@/database";
import { USER_PUBLIC_SELECT } from "@/helpers/user";
import { createSuccessMessage } from "@/helpers/response";

export default async (ctx: Context) => {
  const users = await prisma.user.findMany({
    select: USER_PUBLIC_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return ctx.status(
    200,
    createSuccessMessage({
      message: "Lấy danh sách người dùng thành công",
      result: users,
    })
  );
};
