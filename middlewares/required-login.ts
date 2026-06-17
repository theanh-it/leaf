import type { Context } from "elysia";

import { createErrorMessage } from "@/helpers/response";
import { verifyToken } from "@/helpers/auth";
import { getToken } from "@/helpers/request";

import type { BodyJWT } from "@/types";

export default async (context: Context) => {
  try {
    const token = getToken(context);

    if (!token) {
      const errorMessage = createErrorMessage({
        message: "auth.requiredToken",
        result: {
          token: "auth.requiredToken",
        },
      });

      return context.status(401, errorMessage);
    }

    const decoded = await verifyToken(token);
    const user = decoded as BodyJWT;

    Object.assign(context, { user });
  } catch (error) {
    const errorMessage = createErrorMessage({
      message: "auth.invalidToken",
      result: {
        token: "auth.invalidToken",
      },
    });

    return context.status(401, errorMessage);
  }
};
