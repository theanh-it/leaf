import { bladeView } from "leaf-blade";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return bladeView(ctx, "layouts.admin");
};
