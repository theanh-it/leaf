/**
 * View Helper - Giống Laravel's view() function
 * Đơn giản hóa việc render views với SEO tự động
 */

import type { LeafContext } from "@be-types/leaf";
import { generateSEO, generateWebSiteStructuredData } from "@be-helpers/seo";
import { config } from "@be-config/index";

export interface ViewData {
  [key: string]: any;
  // SEO options
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product" | "profile";
  noindex?: boolean;
  // Layout options
  layout?: string;
  lang?: string;
}

/**
 * Render view với SEO tự động (giống Laravel view())
 * 
 * @example
 * // Đơn giản nhất
 * return view('home', { title: 'Home Page' });
 * 
 * // Với SEO tùy chỉnh
 * return view('home', {
 *   title: 'Home Page',
 *   description: 'Page description',
 *   posts: posts
 * });
 * 
 * // Với layout khác
 * return view('admin.dashboard', {
 *   layout: 'admin',
 *   users: users
 * });
 */
export async function view(
  ctx: LeafContext,
  template: string,
  data: ViewData = {}
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
    layout = "base",
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

  // Render với layout
  const html = await ctx.renderWithLayout(template, {
    ...restData,
    // Page metadata
    title,
    description,
    // SEO data
    seo,
    structuredData,
    // Assets
    vite,
    lang,
    twitterHandle: config.seo.twitterHandle,
    js: vite.main,
    css: vite.css,
  }, layout);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * Render JSON response (helper function)
 */
export function json(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

