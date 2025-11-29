import type { Context } from "elysia";
import { config } from "@be-config/index";

export default (ctx: Context) => {
  const baseUrl = config.seo.baseUrl;
  const isProduction = config.nodeEnv === "production";

  // Generate robots.txt content
  const robots = isProduction
    ? `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`
    : `User-agent: *
Disallow: /

# Development mode - block all crawlers`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache 24 hours
    },
  });
};

