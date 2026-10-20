import type { Context } from "elysia";
import { z } from "zod";

import { prisma } from "@/database";
import { usernameSchema, passwordSchema } from "@/helpers/auth-schema";
import { hashPassword } from "@/helpers/password";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { getUniqueFieldError, USER_PUBLIC_SELECT } from "@/helpers/user";

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  fullname: z.string().trim().min(1).max(255),
});

export default async (context: Context) => {
  const validation = await validateData(context.body, registerSchema);
  if (validation.errors) {
    return context.status(
      422,
      createErrorMessage({
        status: "validation_error",
        message: "validation.error",
        result: validation.errors,
      })
    );
  }

  const data = validation.output;
  try {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: await hashPassword(data.password),
        fullname: data.fullname,
        type: "customer",
        status: "pending",
      },
      select: USER_PUBLIC_SELECT,
    });
    return context.status(
      201,
      createSuccessMessage({ message: "register.success", result: user })
    );
  } catch (error) {
    // DB là nguồn xác thực unique, kể cả hai request đăng ký đồng thời.
    if (getUniqueFieldError(error)) {
      return context.status(
        422,
        createErrorMessage({
          status: "validation_error",
          message: "validation.error",
          result: { username: "users.usernameAlreadyExists" },
        })
      );
    }
    throw error;
  }
};
