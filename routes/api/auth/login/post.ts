import type { Context } from "elysia";
import { z } from "zod";

import { prisma } from "@/database";
import { comparePassword } from "@/helpers/password";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { signJWT } from "@/helpers/auth";
import { USER_PUBLIC_SELECT } from "@/helpers/user";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(255),
  password: z
    .string()
    .min(1)
    .max(255)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      message: "users.passwordTooLong",
    }),
  deviceId: z.string().max(255).nullable().optional(),
  remember: z.boolean().default(false),
});

export default async (context: Context) => {
  const validation = await validateData(context.body, loginSchema);
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
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.username },
        { phone: data.username },
      ],
    },
    select: { ...USER_PUBLIC_SELECT, password: true },
  });

  if (!user || !(await comparePassword(data.password, user.password))) {
    return context.status(
      401,
      createErrorMessage({
        message: "login.failed",
        result: { password: "login.invalidCredentials" },
      })
    );
  }
  if (user.status !== "active") {
    return context.status(
      403,
      createErrorMessage({ message: "auth.accountUnavailable" })
    );
  }

  const token = await signJWT(
    { id: user.id, username: user.username, deviceId: data.deviceId },
    data.remember
  );
  const { password: _password, ...profile } = user;
  return createSuccessMessage({
    message: "login.success",
    result: { token, user: profile },
  });
};
