import type { Elysia } from "elysia";
import { createErrorMessage } from "@/helpers/response";
import { logger } from "@/plugins/logger";

export const errorHandlerPlugin = () => (app: Elysia) => {
  return app.onError(({ code, error, set, path, request }) => {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const data = { code, method: request.method, path };
    if (code === "NOT_FOUND") logger.warn("Resource not found", data);
    else logger.error("Request failed", { ...data, error: detail });

    let message: string;
    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        message = "http.notFound";
        break;
      case "VALIDATION":
        set.status = 400;
        message = "validation.error";
        break;
      case "PARSE":
        set.status = 400;
        message = "request.parseError";
        break;
      default:
        set.status = 500;
        message = "server.error";
    }
    return createErrorMessage({
      message,
      ...(process.env.NODE_ENV === "development" ? { result: { detail } } : {}),
    });
  });
};
