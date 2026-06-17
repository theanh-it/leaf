import type { Context } from "elysia";
import { z } from "zod";

import { prisma } from "@/database";
import { hashPassword } from "@/helpers/password";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import {
  USER_PUBLIC_SELECT,
  USER_STATUSES,
  USER_TYPES,
  emptyToNull,
  getUniqueFieldError,
} from "@/helpers/user";
import { STATUS_RESPONSE } from "@/constants";

const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  fullname: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(255).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  type: z.enum(USER_TYPES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

type UpdateUserBody = z.infer<typeof updateUserSchema>;

export default async (context: Context) => {
  const { id } = context.params as { id: string };
  const body = context.body as UpdateUserBody;

  const resultValidate = await validateData(body, updateUserSchema);

  if (resultValidate.errors) {
    return context.status(
      422,
      createErrorMessage({
        message: "validation.error",
        result: resultValidate.errors,
      })
    );
  }

  const data = resultValidate.output;
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

  try {
    const updateData: Record<string, unknown> = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.fullname !== undefined) updateData.fullname = emptyToNull(data.fullname);
    if (data.email !== undefined) updateData.email = emptyToNull(data.email);
    if (data.phone !== undefined) updateData.phone = emptyToNull(data.phone);
    if (data.address !== undefined) updateData.address = emptyToNull(data.address);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_PUBLIC_SELECT,
    });

    return context.status(
      200,
      createSuccessMessage({
        message: "Cập nhật người dùng thành công",
        result: user,
      })
    );
  } catch (error) {
    const field = getUniqueFieldError(error);

    if (field) {
      return context.status(
        422,
        createErrorMessage({
          message: "validation.error",
          result: {
            [field]: `users.${field}AlreadyExists`,
          },
        })
      );
    }

    throw error;
  }
};
