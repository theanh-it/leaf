import type { Context } from "elysia";

export interface ViteAssets {
  main: string;
  css: string[];
  imports: string[];
}

interface LeafContextExtensions {
  vite?: ViteAssets;
  // Blade template engine
  blade?: {
    render: (template: string, data?: Record<string, any>) => Promise<string>;
  };
}

/**
 * Extended Context type với các custom extensions
 */
export type LeafContext = Context & LeafContextExtensions;
