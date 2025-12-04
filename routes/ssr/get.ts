import { bladeView } from "leaf-blade";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  // Sample data cho template
  const features = [
    {
      title: "⚡ Nhanh",
      description: "Built với Bun runtime - nhanh nhất hiện tại",
    },
    {
      title: "🎨 Modern",
      description: "Vue 3 với Composition API và SCSS",
    },
    {
      title: "🔍 SEO",
      description: "Tối ưu SEO với SSR và structured data",
    },
  ];

  return bladeView(ctx, "home", {
    title: "Leaf App - Ứng dụng SSR hiệu năng cao",
    description: "Ứng dụng Leaf với SSR và Vue 3, tối ưu SEO và performance",
    lang: "vi",
    features,
  });
};
