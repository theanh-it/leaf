import { bladeView } from "leaf-blade";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  const name = ctx.params.name;

  return bladeView(ctx, "about", {
    title: `${name} test`,
    description: `${name} is a social media platform for pet lovers.`,
  });
};
