/**
 * Example route sử dụng Blade template engine
 */

import type { LeafContext } from "@be-types/leaf";
import { bladeView } from "@be-helpers/blade-view";

export default async (ctx: LeafContext) => {
  return bladeView(ctx, "home", {
    title: "Home - Leaf App",
    description: "Welcome to Leaf với Blade template engine",
    features: [
      {
        title: "⚡ Nhanh",
        description: "Built với Bun runtime - nhanh nhất hiện tại",
      },
      {
        title: "🎨 Modern",
        description: "Vue 3 với Composition API và Blade templates",
      },
      {
        title: "🔍 SEO",
        description: "Tối ưu SEO với SSR và structured data",
      },
      {
        title: "🌿 Blade",
        description: "Template engine giống Laravel Blade",
      },
    ],
  });
};

