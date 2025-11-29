import type { Context } from "elysia";
import { config } from "@be-config/index";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls
    .map((url) => {
      return `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : ""}${url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : ""}${url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : ""}  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export default async (ctx: Context) => {
  const baseUrl = config.seo.baseUrl;

  // Define your routes here
  // In production, you might want to fetch this from a database or CMS
  const routes: SitemapUrl[] = [
    {
      loc: `${baseUrl}/`,
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString().split("T")[0],
    },
    // Add more routes as needed
    // {
    //   loc: `${baseUrl}/about`,
    //   changefreq: "monthly",
    //   priority: 0.8,
    // },
    // {
    //   loc: `${baseUrl}/blog`,
    //   changefreq: "weekly",
    //   priority: 0.9,
    // },
  ];

  const sitemap = generateSitemapXML(routes);

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache 1 hour
    },
  });
};

