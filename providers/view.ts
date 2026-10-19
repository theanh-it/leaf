import type { BladeOptions } from "leaf-blade";

import { config } from "@be-config";
import { getSiteLayout } from "@be-services/site-layout";

import type { LeafContext } from "@be-types/leaf";

export const viewProvider = {
  shared: {
    site: Object.freeze({
      name: config.seo.siteName,
      url: config.seo.baseUrl,
    }),
    lang: "vi",
  },
  resolveData: () => ({
    siteLayout: getSiteLayout(),
  }),
} satisfies Pick<BladeOptions<LeafContext>, "shared" | "resolveData">;
