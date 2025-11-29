/// <reference path="../../types/elysia.d.ts" />
import type { Context } from "elysia";

export default async (ctx: Context) => {
  const vite = ctx.vite || { main: "", css: "" };

  const html = await ctx.render("home.ejs", {
    title: "Leaf App",
    description: "Ứng dụng Leaf với SSR và Vue 3",
    js: vite.main,
    css: vite.css,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
