import type { Context } from "elysia";
import type { BladeContextExtensions } from "leaf-blade";

export interface ViteAssets {
  main: string;
  css: string[];
  imports: string[];
}

interface LeafContextExtensions {
  vite?: ViteAssets;
  // Blade template engine
  blade?: BladeContextExtensions["blade"];
}

/**
 * Extended Context type với các custom extensions
 */
export type LeafContext = Context & LeafContextExtensions;
