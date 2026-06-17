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

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(255),
  password: z.string().min(6).max(255),
  fullname: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(255).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  type: z.enum(USER_TYPES).default("customer"),
  status: z.enum(USER_STATUSES).default("pending"),
});

type CreateUserBody = z.infer<typeof createUserSchema>;

export default async (context: Context) => {
  const body = context.body as CreateUserBody;

  const resultValidate = await validateData(body, createUserSchema);

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

  try {
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: passwordHash,
        fullname: emptyToNull(data.fullname),
        email: emptyToNull(data.email),
        phone: emptyToNull(data.phone),
        address: emptyToNull(data.address),
        type: data.type,
        status: data.status,
      },
      select: USER_PUBLIC_SELECT,
    });

    return context.status(
      200,
      createSuccessMessage({
        message: "Tạo người dùng thành công",
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
