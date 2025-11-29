/**
 * Example route sử dụng Blade template engine
 */

import type { LeafContext } from "@be-types/leaf";
import { bladeView } from "@be-helpers/blade-view";

export default async (ctx: LeafContext) => {
  return bladeView(ctx, "about", {
    title: "About - Leaf App",
    description: "Về chúng tôi - Leaf Framework với Blade template engine",
  });
};
