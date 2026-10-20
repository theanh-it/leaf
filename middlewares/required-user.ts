import type { ContextAuth } from "@/types";
import { createErrorMessage } from "@/helpers/response";

export default async (context: ContextAuth) => {
  if (!context.user?.id || context.user.status !== "active") {
    return context.status(
      401,
      createErrorMessage({ message: "auth.accountUnavailable" })
    );
  }
};
