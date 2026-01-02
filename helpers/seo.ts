import {
  extendMetaOptions,
  generateMetaTags,
  generateSchemaScripts,
  renderHead,
} from "leaf-seo";
import type { BaseMetaConfig } from "leaf-seo";

// Define base config common to entire website
const baseConfig: BaseMetaConfig = {
  siteName: "My Website",
  locale: "vi_VN",
  favicon: "https://example.com/favicon.ico",
  themeColor: "#ffffff",
  fbAppId: "123456789",
  twitterCard: "summary_large_image",
  robots: "index, follow",
  canonical: true,
  keywords: ["website", "default"],
};

export const generateSeo = (options: any, html: boolean = false) => {
  const pageOptions = extendMetaOptions(baseConfig, options);
  const metaTags = generateMetaTags(pageOptions);
  const schemaScripts = generateSchemaScripts(pageOptions);

  if (!html) {
    return { pageInfo: pageOptions, metaTags, schemaScripts };
  }

  return renderHead(metaTags, schemaScripts, options.title, {
    escapeHtml: true,
  });
};
