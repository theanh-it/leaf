import ejs from "ejs";
import fs from "fs";
import path from "path";
import { minify } from "html-minifier-terser";

export interface EjsOptions {
  viewsDir?: string;
  cache?: boolean;
  minify?: boolean;
}

const ejsCache = new Map<string, string>();

export const ejsPlugin = (options: EjsOptions = {}) => {
  const viewsDir = options.viewsDir || path.join(process.cwd(), "views/ejs");
  const cache = options.cache ?? true;
  const shouldMinify = options.minify ?? process.env.NODE_ENV === "production";

  return (app: any) => {
    return app.derive(() => {
      // Tạo function render
      const render = async (
        template: string,
        data: Record<string, any> = {}
      ) => {
        const templatePath = path.join(viewsDir, template);

        let templateContent: string;

        if (cache && ejsCache.has(templatePath)) {
          templateContent = ejsCache.get(templatePath)!;
        } else {
          if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
          }
          templateContent = fs.readFileSync(templatePath, "utf-8");
          if (cache) {
            ejsCache.set(templatePath, templateContent);
          }
        }

        let html = ejs.render(templateContent, {
          ...data,
          // Thêm các helper functions nếu cần
        });

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

      // Return object mới với render method
      return {
        render,
      };
    });
  };
};
