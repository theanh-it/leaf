import type { Context } from "elysia";
import { z } from "zod";

import { hashPassword } from "@/helpers/password";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { prisma } from "@/database";

const registerSchema = z.object({
  username: z.string(),
  password: z.string(),
  fullname: z.string(),
});

type RegisterBody = z.infer<typeof registerSchema>;

export default async (context: Context) => {
  const body = context.body as RegisterBody;

  const resultValidate = await validateData(body, registerSchema);

  if (resultValidate.errors) {
    const errorMessage = createErrorMessage({
      result: resultValidate.errors,
      message: "validation.error",
    });

    return context.status(422, errorMessage);
  }

  const user = await prisma.user.findFirst({
    where: {
      username: body.username,
    },
  });

  if (user) {
    const errorMessage = createErrorMessage({
      message: "register.failed",
      result: {
        email: "register.emailAlreadyExists",
      },
    });

    return context.status(422, errorMessage);
  }

  const passwordHash = await hashPassword(body.password);

  const newUser = await prisma.user.create({
    data: {
      username: body.username,
      password: passwordHash,
      fullname: body.fullname,
    },
  });

  const successMessage = createSuccessMessage({
    message: "register.success",
    result: {
      id: newUser.id,
      email: newUser.email,
      fullname: newUser.fullname,
    },
  });

  return context.status(200, successMessage);
};
