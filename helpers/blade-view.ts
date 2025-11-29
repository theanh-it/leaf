/**
 * Blade View Helper
 * Render Blade templates với SEO tự động (giống Laravel view())
 */

import type { LeafContext } from "@be-types/leaf";
import { generateSEO, generateWebSiteStructuredData } from "@be-helpers/seo";
import { config } from "@be-config/index";

export interface BladeViewData {
  [key: string]: any;
  // SEO options
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product" | "profile";
  noindex?: boolean;
  lang?: string;
}

/**
 * Render Blade template với SEO tự động
 * 
 * @example
 * // Đơn giản nhất
 * return bladeView(ctx, 'home', { title: 'Home Page' });
 * 
 * // Với data
 * return bladeView(ctx, 'posts.show', {
 *   title: post.title,
 *   post: post
 * });
 */
export async function bladeView(
  ctx: LeafContext,
  template: string,
  data: BladeViewData = {}
): Promise<Response> {
  const path = ctx.path || "/";
  const vite = ctx.vite || { main: "", css: "" };

  // Extract SEO options từ data
  const {
    title = "Leaf App",
    description = "Ứng dụng Leaf với SSR và Vue 3",
    image,
    type = "website",
    noindex,
    lang = "vi",
    ...restData
  } = data;

  // Generate SEO data tự động
  const seo = generateSEO(
    {
      title,
      description,
      image: image || config.seo.defaultImage,
      url: path,
      type,
      siteName: config.seo.siteName,
      locale: config.seo.locale,
      noindex,
    },
    config.seo.baseUrl
  );

  // Generate structured data tự động
  const structuredData = [
    generateWebSiteStructuredData(config.seo.baseUrl, config.seo.siteName),
  ];

  // Render Blade template
  const html = await (ctx as any).blade.render(template, {
    ...restData,
    // Page metadata
    title,
    description,
    // SEO data (nếu Blade layout cần)
    seo,
    structuredData,
    // Assets
    vite,
    lang,
    js: vite.main,
    css: vite.css,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

