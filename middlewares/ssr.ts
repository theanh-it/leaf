import { join } from "node:path";

import type { LeafContext, ViteAssets } from "@be-types/leaf";

type ManifestChunk = {
  file: string;
  css?: string | string[];
  imports?: string[];
  dynamicImports?: string[];
};
type ViteManifest = Record<string, ManifestChunk>;
type FrontendApp = "public" | "admin";

const EMPTY_ASSETS: ViteAssets = { main: "", css: [], imports: [] };
const MANIFEST_PATH = join(process.cwd(), "dist/frontend/.vite/manifest.json");
const IS_PROD = process.env.NODE_ENV === "production";
const ENTRY_KEYS: Record<FrontendApp, string> = {
  public: "index.html",
  admin: "admin.html",
};

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const withSlash = (p: string) => (p.startsWith("/") ? p : `/${p}`);

function buildAssets(
  manifest: ViteManifest,
  frontendApp: FrontendApp
): ViteAssets {
  const entryKey = ENTRY_KEYS[frontendApp];
  const entry = manifest[entryKey];
  if (!entry) return EMPTY_ASSETS;

  const css = new Set<string>(toArray(entry.css));
  const visited = new Set<string>();
  const stack: string[] = [...(entry.imports ?? [])];

  // Iterative thay vì đệ quy: an toàn với graph imports lớn.
  while (stack.length > 0) {
    const key = stack.pop()!;
    if (key === entryKey || visited.has(key)) continue;
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
const cachedAssets = new Map<FrontendApp, ViteAssets>();
const inflight = new Map<FrontendApp, Promise<ViteAssets>>();

async function loadAssets(frontendApp: FrontendApp): Promise<ViteAssets> {
  const cached = cachedAssets.get(frontendApp);
  if (IS_PROD && cached) return cached;

  const pending = inflight.get(frontendApp);
  if (pending) return pending;

  const loading = (async () => {
    try {
      const file = Bun.file(MANIFEST_PATH);
      if (!(await file.exists())) return EMPTY_ASSETS;
      const manifest = (await file.json()) as ViteManifest;
      const assets = buildAssets(manifest, frontendApp);
      if (IS_PROD) cachedAssets.set(frontendApp, assets);
      return assets;
    } catch (err) {
      console.error("[ssr] Failed to load Vite manifest:", err);
      return EMPTY_ASSETS;
    } finally {
      inflight.delete(frontendApp);
    }
  })();

  inflight.set(frontendApp, loading);
  return loading;
}

export const ssrMiddleware = async (ctx: LeafContext): Promise<void> => {
  ctx.vite = await loadAssets(resolveFrontendApp(ctx.path));
};

function resolveFrontendApp(pathname: string): FrontendApp {
  if (pathname === "/login") return "admin";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";

  return "public";
}
