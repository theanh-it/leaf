import type { Context } from "elysia";
import { z } from "zod";

import { prisma } from "@/database";

import { comparePassword } from "@/helpers/password";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { signJWT } from "@/helpers/auth";

import type { BodyJWT } from "@/types";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  deviceId: z.string().nullable().optional(),
});

type LoginBody = z.infer<typeof loginSchema>;

export default async (context: Context) => {
  const body = context.body as LoginBody;

  const resultValidate = await validateData(body, loginSchema);

  if (resultValidate.errors) {
    const errorMessage = createErrorMessage({
      result: resultValidate.errors,
      message: "validation.error",
    });

    return context.status(422, errorMessage);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: body.username },
        { email: body.username },
        { phone: body.username },
      ],
    },
  });

  if (!user) {
    const errorMessage = createErrorMessage({
      message: "login.failed",
      result: {
        username: "login.usernameNotFound",
      },
    });

    return context.status(422, errorMessage);
  }

  const isPasswordValid = await comparePassword(body.password, user.password);

  if (!isPasswordValid) {
    const errorMessage = createErrorMessage({
      message: "login.failed",
      result: {
        password: "login.passwordNotMatch",
      },
    });

    return context.status(422, errorMessage);
  }

  const bodyJWT: BodyJWT = {
    id: user.id,
    username: user.username,
    deviceId: body.deviceId,
  };

  const token = await signJWT(bodyJWT, true);

  const successMessage = createSuccessMessage({
    message: "login.success",
    result: {
      token,
      user: bodyJWT,
    },
  });

  return context.status(200, successMessage);
};
