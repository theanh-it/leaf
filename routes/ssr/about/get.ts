import { bladeView } from "leaf-blade";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return bladeView(ctx, "about", {
    title: "About test",
    description: "PetMe is a social media platform for pet lovers.",
  });
};
