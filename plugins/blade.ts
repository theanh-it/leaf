/**
 * Blade Plugin for Elysia
 * Template engine giống Laravel Blade
 */

import type { Elysia } from "elysia";
import path from "path";
import { BladeRenderer } from "@be-engines/blade/renderer";
import { minify } from "html-minifier-terser";

export interface BladeOptions {
  viewsDir?: string;
  cache?: boolean;
  cacheDir?: string;
  minify?: boolean;
}

export const bladePlugin = (options: BladeOptions = {}) => {
  const viewsDir = options.viewsDir || path.join(process.cwd(), "views/blade");
  const cache = options.cache ?? true;
  const shouldMinify = options.minify ?? process.env.NODE_ENV === "production";

  // Create Blade renderer
  const renderer = new BladeRenderer({
    viewsDir,
    cache,
    cacheDir: options.cacheDir,
  });

  return (app: Elysia) => {
    return app.derive(() => {
      /**
       * Render Blade template
       */
      const render = async (
        template: string,
        data: Record<string, any> = {}
      ) => {
        let html = await renderer.render(template, data);

        // Minify HTML nếu được bật
        if (shouldMinify) {
          html = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
          });
        }

        return html;
      };

      return {
        blade: {
          render,
        },
      };
    });
  };
};

