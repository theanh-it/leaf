import type { Context } from "elysia";

import { prisma } from "@/database";
import { USER_PUBLIC_SELECT } from "@/helpers/user";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { STATUS_RESPONSE } from "@/constants";

export default async (context: Context) => {
  const { id } = context.params as { id: string };

  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_PUBLIC_SELECT,
  });

  if (!user) {
    return context.status(
      404,
      createErrorMessage({
        status: STATUS_RESPONSE.error,
        message: "users.notFound",
      })
    );
  }

  return context.status(
    200,
    createSuccessMessage({
      message: "Lấy thông tin người dùng thành công",
      result: user,
    })
  );
};
