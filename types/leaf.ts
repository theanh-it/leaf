import type { Context } from "elysia";

interface LeafContextExtensions {
  render: (template: string, data?: Record<string, any>) => Promise<string>;
  renderWithLayout: (
    template: string,
    data?: Record<string, any>,
    layout?: string
  ) => Promise<string>;
  vite?: {
    main: string;
    css: string;
  };
  status: <T = any>(code: number, data?: T) => T;
  // View helper (giống Laravel view())
  view: (template: string, data?: Record<string, any>) => Promise<Response>;
  // Blade template engine
  blade?: {
    render: (template: string, data?: Record<string, any>) => Promise<string>;
  };
}

/**
 * Extended Context type với các custom extensions
 */
export type LeafContext = Context & LeafContextExtensions;
