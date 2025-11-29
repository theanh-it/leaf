import type { Context } from "elysia";

export default async (ctx: Context) => {
  return ctx.status(200, {
    message: "Hello users",
  });
};
