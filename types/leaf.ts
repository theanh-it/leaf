import type { Context } from "elysia";

interface LeafContextExtensions {
  vite?: {
    main: string;
    css: string;
  };
  // Blade template engine
  blade?: {
    render: (template: string, data?: Record<string, any>) => Promise<string>;
  };
}

/**
 * Extended Context type với các custom extensions
 */
export type LeafContext = Context & LeafContextExtensions;
