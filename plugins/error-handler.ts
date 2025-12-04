import type { Elysia } from "elysia";

export const errorHandlerPlugin = () => {
  return (app: Elysia) => {
    return app.onError(({ code, error, set }: any) => {
      // Log error đơn giản - chỉ 1 dòng
      if (code === "NOT_FOUND") {
        // Bỏ qua log cho 404 errors (thường là static files)
      } else {
        console.error(`[${code}] ${error.message || error}`);
      }

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
