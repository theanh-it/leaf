import { join } from "node:path";

import type { LeafContext, ViteAssets } from "@be-types/leaf";

type ManifestChunk = {
  file: string;
  css?: string | string[];
  imports?: string[];
  dynamicImports?: string[];
};
type ViteManifest = Record<string, ManifestChunk>;

const EMPTY_ASSETS: ViteAssets = { main: "", css: [], imports: [] };
const MANIFEST_PATH = join(process.cwd(), "dist/fe/.vite/manifest.json");
const IS_PROD = process.env.NODE_ENV === "production";

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const withSlash = (p: string) => (p.startsWith("/") ? p : `/${p}`);

function buildAssets(manifest: ViteManifest): ViteAssets {
  const entry = manifest["index.html"];
  if (!entry) return EMPTY_ASSETS;

  const css = new Set<string>(toArray(entry.css));
  const visited = new Set<string>();
  const stack: string[] = [...(entry.imports ?? [])];

  // Iterative thay vì đệ quy: an toàn với graph imports lớn.
  while (stack.length > 0) {
    const key = stack.pop()!;
    if (key === "index.html" || visited.has(key)) continue;
    const chunk = manifest[key];
    if (!chunk) continue;
    visited.add(key);
    for (const c of toArray(chunk.css)) css.add(c);
    if (chunk.imports?.length) stack.push(...chunk.imports);
  }

  const imports = Array.from(visited, (k) => manifest[k]?.file)
    .filter((f): f is string => Boolean(f))
    .map(withSlash);

  return {
    main: withSlash(entry.file),
    css: Array.from(css, withSlash),
    imports,
  };
}

// Cache assets ở production; dev luôn đọc mới để hot-reload theo build.
// Single-flight tránh nhiều request đầu tiên cùng đọc/parse manifest song song.
let cachedAssets: ViteAssets | null = null;
let inflight: Promise<ViteAssets> | null = null;

async function loadAssets(): Promise<ViteAssets> {
  if (IS_PROD && cachedAssets) return cachedAssets;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const file = Bun.file(MANIFEST_PATH);
      if (!(await file.exists())) return EMPTY_ASSETS;
      const manifest = (await file.json()) as ViteManifest;
      const assets = buildAssets(manifest);
      if (IS_PROD) cachedAssets = assets;
      return assets;
    } catch (err) {
      console.error("[ssr] Failed to load Vite manifest:", err);
      return EMPTY_ASSETS;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export const ssrMiddleware = async (ctx: LeafContext): Promise<void> => {
  ctx.vite = await loadAssets();
};
