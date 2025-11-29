import type { Elysia } from "elysia";

/**
 * Response Helper Plugin
 * Thêm helper method status() vào Context để dễ dàng trả về response với status code
 * 
 * Sử dụng:
 *   return ctx.status(200, { message: "Success" });
 *   return ctx.status(404, { error: "Not Found" });
 */
export const responseHelperPlugin = () => {
  return (app: Elysia) => {
    return app.derive(({ set }) => {
      // Helper method để set status code và trả về data
      const status = <T = any>(code: number, data?: T): T => {
        set.status = code;
        return data as T;
      };

      return {
        status,
      };
    });
  };
};

