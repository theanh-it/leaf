import type { ContextAuth } from "@/types";
import { createErrorMessage } from "@/helpers/response";

export default async (context: ContextAuth) => {
  if (context.user?.status !== "active" || context.user?.type !== "admin") {
    return context.status(
      403,
      createErrorMessage({ message: "auth.forbidden" })
    );
  }
};
