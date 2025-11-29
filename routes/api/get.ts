import type { LeafContext } from "@be-types/leaf";

export default (ctx: LeafContext) => {
  return ctx.status(200, {
    message: "Hello World API",
  });
};
