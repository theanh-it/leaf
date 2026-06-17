import { MESSAGE, ERROR } from "@/constants/message";
import { createErrorMessage } from "@/helpers/response";

import { STATUS_RESPONSE } from "@/constants";

import type { ContextCustom } from "@/types";

export default async (context: ContextCustom) => {
  if (!context.user || !context.user.id || context.user.username !== "admin") {
    const errorMessage = createErrorMessage({
      status: STATUS_RESPONSE.validationError,
      message: MESSAGE.validationError,
      result: {
        token: ERROR.requiredToken,
      },
    });

    return context.status(422, errorMessage);
  }
};
