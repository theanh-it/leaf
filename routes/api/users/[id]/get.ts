import type { Context } from "elysia";
import { z } from "zod";
import { validateData } from "@/helpers/request";

import { prisma } from "@/database";
import { USER_PUBLIC_SELECT } from "@/helpers/user";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { STATUS_RESPONSE } from "@/constants";

export default async (context: Context) => {
  const params = await validateData(context.params, z.object({ id: z.uuid() }));
  if (params.errors) {
    return context.status(
      422,
      createErrorMessage({ message: "validation.error", result: params.errors })
    );
  }
  const { id } = params.output;

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
