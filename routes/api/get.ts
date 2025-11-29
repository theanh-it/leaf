import type { Context } from "elysia";

export default (ctx: Context) => {
  return ctx.status(200, {
    message: "Hello World API",
  });
};
