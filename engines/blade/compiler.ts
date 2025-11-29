/**
 * Blade Compiler
 * Compile Blade-like syntax thành executable code
 * Tương tự Laravel Blade nhưng phù hợp với JavaScript/TypeScript
 */

import fs from "fs";
import path from "path";

export interface BladeCompileOptions {
  viewsDir: string;
  cacheDir?: string;
  cache?: boolean;
}

export class BladeCompiler {
  private viewsDir: string;
  private cacheDir: string;
  private cache: boolean;

  constructor(options: BladeCompileOptions) {
    this.viewsDir = options.viewsDir;
    this.cacheDir = options.cacheDir || path.join(process.cwd(), "storage/blade");
    this.cache = options.cache ?? true;

    // Tạo cache directory nếu chưa có
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Compile Blade template thành executable JavaScript code
   */
  compile(templateContent: string, templatePath: string): string {
    let compiled = templateContent;

    // 1. @extends directive
    compiled = this.compileExtends(compiled, templatePath);

    // 2. @section/@yield directives
    compiled = this.compileSections(compiled);

    // 3. @include directive
    compiled = this.compileInclude(compiled, templatePath);

    // 4. @if/@elseif/@else/@endif
    compiled = this.compileConditionals(compiled);

    // 5. @foreach/@endforeach
    compiled = this.compileForeach(compiled);

    // 6. @for/@endfor
    compiled = this.compileFor(compiled);

    // 7. @while/@endwhile
    compiled = this.compileWhile(compiled);

    // 8. Variables: {{ }} và {!! !!}
    compiled = this.compileVariables(compiled);

    // 9. Comments: {{-- --}}
    compiled = this.compileComments(compiled);

    // 10. @php/@endphp (optional - execute JavaScript instead)
    compiled = this.compilePhp(compiled);

    return compiled;
  }

  /**
   * Compile @extends directive
   * @extends('layout') → layout inheritance
   */
  private compileExtends(content: string, templatePath: string): string {
    const extendsRegex = /@extends\(['"]([^'"]+)['"]\)/g;
    return content.replace(extendsRegex, (match, layoutName) => {
      // Mark extends - sẽ xử lý trong render function
      return `<!-- BLADE_EXTENDS:${layoutName} -->`;
    });
  }

  /**
   * Compile @section/@yield directives
   * @section('name') ... @endsection → section definition
   * @yield('name') → render section
   */
  private compileSections(content: string): string {
    // Compile @section
    content = content.replace(
      /@section\(['"]([^'"]+)['"]\)([\s\S]*?)@endsection/g,
      (match, name, body) => {
        return `<!-- BLADE_SECTION_START:${name} -->${body}<!-- BLADE_SECTION_END:${name} -->`;
      }
    );

    // Compile @yield
    content = content.replace(/@yield\(['"]([^'"]+)['"]\)(?:,\s*['"]([^'"]*)['"])?/g, (match, name, defaultValue) => {
      const defaultVal = defaultValue ? `<!-- BLADE_DEFAULT:${defaultValue} -->` : "";
      return `<!-- BLADE_YIELD:${name} -->${defaultVal}`;
    });

    return content;
  }

  /**
   * Compile @include directive
   * @include('partial') → include partial
   */
  private compileInclude(content: string, templatePath: string): string {
    // @include('partial')
    content = content.replace(/@include\(['"]([^'"]+)['"]\)/g, (match, partial) => {
      return `<!-- BLADE_INCLUDE:${partial} -->`;
    });

    // @include('partial', { data })
    content = content.replace(/@include\(['"]([^'"]+)['"],\s*({[^}]+})\)/g, (match, partial, data) => {
      return `<!-- BLADE_INCLUDE_WITH:${partial}:${data} -->`;
    });

    return content;
  }

  /**
   * Compile conditional statements
   * @if/@elseif/@else/@endif
   */
  private compileConditionals(content: string): string {
    // @if
    content = content.replace(/@if\s*\(([^)]+)\)/g, (match, condition) => {
      return `<% if (${this.parseExpression(condition)}) { %>`;
    });

    // @elseif
    content = content.replace(/@elseif\s*\(([^)]+)\)/g, (match, condition) => {
      return `<% } else if (${this.parseExpression(condition)}) { %>`;
    });

    // @else
    content = content.replace(/@else\b/g, () => {
      return `<% } else { %>`;
    });

    // @endif
    content = content.replace(/@endif\b/g, () => {
      return `<% } %>`;
    });

    return content;
  }

  /**
   * Compile @foreach directive
   * @foreach($items as $item) ... @endforeach
   */
  private compileForeach(content: string): string {
    // @foreach($items as $item)
    content = content.replace(/@foreach\s*\(([^)]+)\)/g, (match, expression) => {
      // Parse: $items as $item hoặc ($items as $key => $item)
      const asMatch = expression.match(/^\s*\$?(\w+)\s+as\s+(?:\$(\w+)\s*=>\s*)?\$(\w+)\s*$/);
      if (asMatch) {
        const [, items, key, item] = asMatch;
        if (key) {
          return `<% for (const [${key}, ${item}] of Object.entries(${items} || [])) { %>`;
        } else {
          return `<% for (const ${item} of (${items} || [])) { %>`;
        }
      }
      return match; // Fallback
    });

    // @endforeach
    content = content.replace(/@endforeach\b/g, () => {
      return `<% } %>`;
    });

    return content;
  }

  /**
   * Compile @for directive
   * @for($i = 0; $i < 10; $i++) ... @endfor
   */
  private compileFor(content: string): string {
    content = content.replace(/@for\s*\(([^)]+)\)/g, (match, expression) => {
      // Parse PHP-style for loop: $i = 0; $i < 10; $i++
      const jsExpression = expression
        .replace(/\$(\w+)/g, "$1") // Remove $ from variables
        .replace(/;/g, ";"); // Keep semicolons
      return `<% for (${jsExpression}) { %>`;
    });

    content = content.replace(/@endfor\b/g, () => {
      return `<% } %>`;
    });

    return content;
  }

  /**
   * Compile @while directive
   */
  private compileWhile(content: string): string {
    content = content.replace(/@while\s*\(([^)]+)\)/g, (match, condition) => {
      return `<% while (${this.parseExpression(condition)}) { %>`;
    });

    content = content.replace(/@endwhile\b/g, () => {
      return `<% } %>`;
    });

    return content;
  }

  /**
   * Compile variables
   * {{ $var }} → escaped output
   * {!! $var !!} → raw output
   * Support expressions: {{ $var + 1 }}, {{ $user.name }}
   */
  private compileVariables(content: string): string {
    // {{ expression }} - escaped (support complex expressions)
    content = content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      const jsExpr = this.parseExpression(expression);
      return `<%- ${jsExpr} %>`;
    });

    // {!! expression !!} - raw
    content = content.replace(/\{!!\s*([^!]+)\s*!!\}/g, (match, expression) => {
      const jsExpr = this.parseExpression(expression);
      return `<%= ${jsExpr} %>`;
    });

    return content;
  }

  /**
   * Compile comments
   * {{-- comment --}} → HTML comment hoặc remove
   */
  private compileComments(content: string): string {
    return content.replace(/\{\{--([\s\S]*?)--\}\}/g, () => {
      // Remove comments in production, keep in development
      return process.env.NODE_ENV === "production" ? "" : "<!-- BLADE_COMMENT -->";
    });
  }

  /**
   * Compile @php directive (optional - execute JavaScript)
   */
  private compilePhp(content: string): string {
    content = content.replace(/@php\s*([\s\S]*?)@endphp/g, (match, code) => {
      // Execute as JavaScript
      return `<% ${code} %>`;
    });

    return content;
  }

  /**
   * Parse expression (remove $, convert PHP syntax to JS)
   * Support: $var, $var.property, expressions
   */
  private parseExpression(expression: string): string {
    return expression
      .trim()
      // Remove $ from variables: $user → user, nhưng giữ nguyên trong strings
      .replace(/\$(\w+)/g, "$1")
      // Convert dot notation to optional chaining: user.name → user?.name
      .replace(/(\w+)\.(\w+)/g, "$1?.$2")
      // Keep operators
      .replace(/===/g, "===")
      .replace(/!==/g, "!==")
      .replace(/&&/g, "&&")
      .replace(/\|\|/g, "||");
  }
}

