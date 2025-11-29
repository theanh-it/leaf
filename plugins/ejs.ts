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

  // Helper function để load template
  const loadTemplate = (templatePath: string): string => {
    if (cache && ejsCache.has(templatePath)) {
      return ejsCache.get(templatePath)!;
    }
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    
    const content = fs.readFileSync(templatePath, "utf-8");
    if (cache) {
      ejsCache.set(templatePath, content);
    }
    return content;
  };

  // Helper function để resolve include paths (dùng chung cho cả render và renderWithLayout)
  const resolveIncludePath = (file: string, currentPath: string): string => {
    const fileWithExt = file.endsWith('.ejs') ? file : `${file}.ejs`;
    let includePath: string;
    
    // Nếu file bắt đầu bằng /, tìm từ viewsDir root
    if (file.startsWith('/')) {
      includePath = path.join(viewsDir, file.substring(1).replace(/^\//, '') + (file.endsWith('.ejs') ? '' : '.ejs'));
    } else {
      // Tìm trong cùng thư mục trước
      includePath = path.join(path.dirname(currentPath), fileWithExt);
    }
    
    // Nếu không tìm thấy, thử trong viewsDir root
    if (!fs.existsSync(includePath)) {
      includePath = path.join(viewsDir, fileWithExt);
    }
    
    // Nếu vẫn không tìm thấy, thử trong partials folder
    if (!fs.existsSync(includePath)) {
      includePath = path.join(viewsDir, 'partials', fileWithExt);
    }
    
    // Nếu vẫn không tìm thấy, thử trong components folder
    if (!fs.existsSync(includePath)) {
      includePath = path.join(viewsDir, 'components', fileWithExt);
    }
    
    return includePath;
  };

  return (app: any) => {
    return app.derive(() => {
      // Tạo function render với EJS helpers
      const render = async (
        template: string,
        data: Record<string, any> = {}
      ) => {
        const templatePath = path.join(viewsDir, template);
        let templateContent = loadTemplate(templatePath);

        // Tạo EJS render options
        const renderOptions: ejs.Options = {
          filename: templatePath,
          root: viewsDir,
          cache: cache,
          compileDebug: process.env.NODE_ENV === "development",
          // Custom include function để hỗ trợ multiple paths
          include: (file: string, includeData?: Record<string, any>) => {
            const includePath = resolveIncludePath(file, templatePath);
            
            if (!fs.existsSync(includePath)) {
              throw new Error(`Include not found: ${file} (searched: ${includePath})`);
            }
            
            const includeContent = loadTemplate(includePath);
            return ejs.render(includeContent, {
              ...data,
              ...includeData,
            }, {
              ...renderOptions,
              filename: includePath,
            });
          },
        };

        let html = ejs.render(templateContent, data, renderOptions);

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

      // Helper để render với layout
      const renderWithLayout = async (
        template: string,
        data: Record<string, any> = {},
        layout: string = "base"
      ) => {
        const templatePath = path.join(viewsDir, template);
        const layoutPath = path.join(viewsDir, layout + ".ejs");

        let templateContent: string;
        let layoutContent: string;

        // Load template
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

        // Load layout
        if (cache && ejsCache.has(layoutPath)) {
          layoutContent = ejsCache.get(layoutPath)!;
        } else {
          if (!fs.existsSync(layoutPath)) {
            throw new Error(`Layout not found: ${layoutPath}`);
          }
          layoutContent = fs.readFileSync(layoutPath, "utf-8");
          if (cache) {
            ejsCache.set(layoutPath, layoutContent);
          }
        }

        // Tạo render options cho template với views directories
        // EJS sẽ tự động tìm file include trong các thư mục này
        const templateRenderOptions: ejs.Options = {
          filename: templatePath,
          root: viewsDir,
          cache: cache,
          compileDebug: process.env.NODE_ENV === "development",
          views: [viewsDir, path.join(viewsDir, 'partials'), path.join(viewsDir, 'components')],
        };

        // Render template content
        const body = ejs.render(templateContent, data, templateRenderOptions);

        // Tạo render options cho layout với custom includer
        const layoutRenderOptions: ejs.Options = {
          filename: layoutPath,
          root: viewsDir,
          cache: cache,
          compileDebug: process.env.NODE_ENV === "development",
          includer: (originalPath: string, parsedPath?: string) => {
            // parsedPath có thể undefined, sử dụng originalPath nếu parsedPath không có
            const filePath = parsedPath || originalPath || '';
            
            if (!filePath) {
              throw new Error(`Include path is empty. Original: ${originalPath}`);
            }
            
            // Tìm file trong các paths có thể
            const fileWithExt = filePath.endsWith('.ejs') ? filePath : `${filePath}.ejs`;
            const possiblePaths = [
              path.join(path.dirname(layoutPath), fileWithExt),
              path.join(viewsDir, fileWithExt),
              path.join(viewsDir, 'template', fileWithExt),
              path.join(viewsDir, 'partials', filePath.split('/').pop() + (filePath.endsWith('.ejs') ? '' : '.ejs')),
            ];
            
            let resolvedPath: string | null = null;
            for (const possiblePath of possiblePaths) {
              if (fs.existsSync(possiblePath)) {
                resolvedPath = possiblePath;
                break;
              }
            }
            
            // Nếu vẫn không tìm thấy, thử resolveIncludePath
            if (!resolvedPath) {
              resolvedPath = resolveIncludePath(filePath, layoutPath);
            }
            
            if (!resolvedPath || !fs.existsSync(resolvedPath)) {
              throw new Error(`Include not found: ${filePath}\nOriginal: ${originalPath}\nSearched:\n${possiblePaths.join('\n')}\nFinal: ${resolvedPath}`);
            }
            
            return {
              filename: resolvedPath,
              template: loadTemplate(resolvedPath),
            };
          },
        };

        // Render layout with body
        let html = ejs.render(layoutContent, {
          ...data,
          body,
        }, layoutRenderOptions);

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

      // Return object mới với render methods
      return {
        render,
        renderWithLayout,
      };
    });
  };
};
