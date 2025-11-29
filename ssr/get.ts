import type { LeafContext } from "@be-types/leaf";

import { bladeView } from "@be-helpers/blade-view";

export default async (ctx: LeafContext) => {
  // Giống Laravel view() - đơn giản và dễ dùng!
  return ctx.view("home.ejs", {
    title: "Leaf App - Ứng dụng SSR hiệu năng cao",
    description: "Ứng dụng Leaf với SSR và Vue 3, tối ưu SEO và performance",
    layout: "template/layout", // Sử dụng layout từ template folder
    lang: "vi",
  });
  // return bladeView(ctx, "home", {
  //   title: "Leaf App - Ứng dụng SSR hiệu năng cao",
  //   description: "Ứng dụng Leaf với SSR và Vue 3, tối ưu SEO và performance",
  //   layout: "layouts/app", // Sử dụng layout từ template folder
  //   lang: "vi",
  // });
};
