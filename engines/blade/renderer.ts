/**
 * Blade Renderer
 * Render compiled Blade templates với layout system
 */

import fs from "fs";
import path from "path";
import ejs from "ejs";
import { BladeCompiler } from "./compiler";

export interface BladeRenderOptions {
  viewsDir: string;
  cache?: boolean;
  cacheDir?: string;
}

export class BladeRenderer {
  private compiler: BladeCompiler;
  private viewsDir: string;
  private cache: boolean;
  private templateCache = new Map<string, string>();

  constructor(options: BladeRenderOptions) {
    this.viewsDir = options.viewsDir;
    this.cache = options.cache ?? true;

    this.compiler = new BladeCompiler({
      viewsDir: options.viewsDir,
      cacheDir: options.cacheDir,
      cache: options.cache,
    });
  }

  /**
   * Load template file
   */
  private loadTemplate(templatePath: string): string {
    if (this.cache && this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, "utf-8");
    if (this.cache) {
      this.templateCache.set(templatePath, content);
    }
    return content;
  }

  /**
   * Resolve template path
   * Support extension: .blade.html
   */
  private resolveTemplate(template: string): string {
    // Nếu đã có extension .blade.html hoặc .blade, dùng luôn
    if (template.endsWith(".blade.html") || template.endsWith(".blade")) {
      return path.join(this.viewsDir, template);
    }
    // Mặc định dùng extension .blade.html
    return path.join(this.viewsDir, `${template}.blade.html`);
  }

  /**
   * Extract extends directive
   */
  private extractExtends(content: string): string | null {
    const match = content.match(/<!-- BLADE_EXTENDS:([^>]+) -->/);
    return match ? match[1] : null;
  }

  /**
   * Extract sections từ template
   */
  private extractSections(content: string): Map<string, string> {
    const sections = new Map<string, string>();
    const sectionRegex =
      /<!-- BLADE_SECTION_START:([^>]+) -->([\s\S]*?)<!-- BLADE_SECTION_END:\1 -->/g;

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      const [, name, body] = match;
      sections.set(name, body.trim());
    }

    return sections;
  }

  /**
   * Process @yield trong layout
   */
  private processYields(
    content: string,
    sections: Map<string, string>
  ): string {
    // Process @yield với default value
    content = content.replace(
      /<!-- BLADE_YIELD:([^>]+) -->(?:<!-- BLADE_DEFAULT:([^>]+) -->)?/g,
      (_match, name, defaultValue) => {
        if (sections.has(name)) {
          return sections.get(name)!;
        }
        return defaultValue || "";
      }
    );

    return content;
  }

  /**
   * Process @include directives
   */
  private async processIncludes(
    content: string,
    _templatePath: string,
    data: Record<string, any>
  ): Promise<string> {
    // Process @include with data
    const includeWithRegex =
      /<!-- BLADE_INCLUDE_WITH:([^:>]+):(\{[^}]+\}) -->/g;
    for (const match of content.matchAll(includeWithRegex)) {
      const [, partial, dataStr] = match;
      const partialData = this.parseDataString(dataStr, data);
      const partialPath = this.resolveTemplate(partial);
      const partialContent = this.loadTemplate(partialPath);
      const compiledPartial = await this.compileAndRender(
        partialContent,
        partialPath,
        { ...data, ...partialData }
      );
      content = content.replace(match[0], compiledPartial);
    }

    // Process simple @include
    const includeRegex = /<!-- BLADE_INCLUDE:([^>]+) -->/g;
    for (const match of content.matchAll(includeRegex)) {
      const [, partial] = match;
      const partialPath = this.resolveTemplate(partial);
      const partialContent = this.loadTemplate(partialPath);
      const compiledPartial = await this.compileAndRender(
        partialContent,
        partialPath,
        data
      );
      content = content.replace(match[0], compiledPartial);
    }

    return content;
  }

  /**
   * Parse data string thành object
   */
  private parseDataString(
    dataStr: string,
    context: Record<string, any>
  ): Record<string, any> {
    try {
      // Simple parser - support basic object syntax
      // { key: value, key2: value2 }
      const obj: Record<string, any> = {};
      const pairs = dataStr.replace(/[{}]/g, "").split(",");

      for (const pair of pairs) {
        const [key, value] = pair.split(":").map((s) => s.trim());
        if (key && value) {
          // Remove quotes
          const cleanValue = value.replace(/^['"]|['"]$/g, "");
          // Try to get from context or use as literal
          obj[key] = context[cleanValue] ?? cleanValue;
        }
      }

      return obj;
    } catch {
      return {};
    }
  }

  /**
   * Compile và render template (recursive cho layouts)
   */
  private async compileAndRender(
    content: string,
    templatePath: string,
    data: Record<string, any>
  ): Promise<string> {
    // Remove extends directive và extract layout
    const layoutName = this.extractExtends(content);
    const contentWithoutExtends = content.replace(
      /<!-- BLADE_EXTENDS:[^>]+ -->/g,
      ""
    );

    // Extract sections từ template
    const rawSections = this.extractSections(contentWithoutExtends);

    // Extract content không nằm trong section markers
    let contentBody = contentWithoutExtends;
    rawSections.forEach((_sectionBody, sectionName) => {
      // Remove section markers và content
      const sectionRegex = new RegExp(
        `<!-- BLADE_SECTION_START:${sectionName} -->[\\s\\S]*?<!-- BLADE_SECTION_END:${sectionName} -->`,
        "g"
      );
      contentBody = contentBody.replace(sectionRegex, "");
    });
    contentBody = contentBody.trim();

    // Compile sections
    const compiledSections = new Map<string, string>();
    for (const [name, sectionBody] of rawSections.entries()) {
      let compiledSection = this.compiler.compile(sectionBody, templatePath);
      // Process includes trong section
      compiledSection = await this.processIncludes(
        compiledSection,
        templatePath,
        data
      );
      compiledSections.set(name, compiledSection);
    }

    // Nếu không có section 'content' nhưng có content body, dùng làm content
    if (!rawSections.has("content") && contentBody) {
      let compiledContent = this.compiler.compile(contentBody, templatePath);
      compiledContent = await this.processIncludes(
        compiledContent,
        templatePath,
        data
      );
      compiledSections.set("content", compiledContent);
    } else if (!rawSections.has("content")) {
      // Nếu không có content, dùng empty string
      compiledSections.set("content", "");
    }

    // If extends layout, render with layout
    if (layoutName) {
      const layoutPath = this.resolveTemplate(layoutName);
      const layoutContent = this.loadTemplate(layoutPath);

      // Compile layout
      let compiledLayout = this.compiler.compile(layoutContent, layoutPath);

      // Process yields với compiled sections
      compiledLayout = this.processYields(compiledLayout, compiledSections);

      // Process includes in layout
      compiledLayout = await this.processIncludes(
        compiledLayout,
        layoutPath,
        data
      );

      // Render layout
      return ejs.render(compiledLayout, data, {
        filename: layoutPath,
        root: this.viewsDir,
      });
    }

    // Render without layout - compile all sections into final HTML
    let finalContent = "";
    if (compiledSections.has("content")) {
      finalContent = compiledSections.get("content")!;
    } else {
      // Compile content body if no sections
      finalContent = this.compiler.compile(contentBody, templatePath);
      finalContent = await this.processIncludes(
        finalContent,
        templatePath,
        data
      );
    }

    return ejs.render(finalContent, data, {
      filename: templatePath,
      root: this.viewsDir,
    });
  }

  /**
   * Render Blade template
   */
  async render(
    template: string,
    data: Record<string, any> = {}
  ): Promise<string> {
    const templatePath = this.resolveTemplate(template);
    const content = this.loadTemplate(templatePath);
    return this.compileAndRender(content, templatePath, data);
  }
}
