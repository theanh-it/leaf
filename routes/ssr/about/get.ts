import { bladeView } from "leaf-blade";
import { generateSeo } from "@be-helpers/seo";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  const seo: any = generateSeo({
    title: "About - Leaf App",
    description: "Về chúng tôi - Leaf Framework với Blade template engine",
    image: "https://example.com/about.jpg",
    url: ctx.path,
    type: "article",
    author: "Leaf Framework",
    publishedDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
  });

  console.log(seo.pageInfo);

  return bladeView(ctx, "about", seo);
};
