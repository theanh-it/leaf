import type { Context } from "elysia";

import { prisma } from "@/database";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { STATUS_RESPONSE } from "@/constants";

import type { BodyJWT } from "@/types";

export default async (context: Context) => {
  const { id } = context.params as { id: string };
  const currentUser = (context as Context & { user?: BodyJWT }).user;

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    return context.status(
      404,
      createErrorMessage({
        status: STATUS_RESPONSE.error,
        message: "users.notFound",
      })
    );
  }

  if (currentUser?.id === id) {
    return context.status(
      422,
      createErrorMessage({
        message: "validation.error",
        result: {
          id: "users.cannotDeleteSelf",
        },
      })
    );
  }

  await prisma.user.delete({ where: { id } });

  return context.status(
    200,
    createSuccessMessage({
      message: "Xóa người dùng thành công",
      result: { id },
    })
  );
};
