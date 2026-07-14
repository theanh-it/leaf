import { bladeView } from "leaf-blade";

import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  console.log("Rendering home page with SSR...");
  return bladeView(ctx, "home", {
    title: "Leaf - A modern web framework for Node.js",
    description:
      "Leaf is a modern web framework for Node.js, built on top of Elysia. It provides a simple and elegant way to build web applications with TypeScript.",
  });
};
