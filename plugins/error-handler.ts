import type { Elysia } from "elysia";

export const errorHandlerPlugin = () => {
  return (app: Elysia) => {
    return app.onError(({ code, error, set }) => {
      // Log error (sẽ thay bằng logger sau)
      console.error(`[Error ${code}]:`, error);

      // Không expose lỗi chi tiết trong production
      const isDevelopment = process.env.NODE_ENV === "development";

      switch (code) {
        case "NOT_FOUND":
          set.status = 404;
          return {
            error: "Not Found",
            message: "The requested resource was not found",
          };

        case "VALIDATION":
          set.status = 400;
          return {
            error: "Validation Error",
            message: isDevelopment ? error.message : "Invalid input",
          };

        case "PARSE":
          set.status = 400;
          return {
            error: "Parse Error",
            message: isDevelopment ? error.message : "Invalid request format",
          };

        case "INTERNAL_SERVER_ERROR":
        default:
          set.status = 500;
          return {
            error: "Internal Server Error",
            message: isDevelopment
              ? error.message
              : "An unexpected error occurred",
          };
      }
    });
  };
};

