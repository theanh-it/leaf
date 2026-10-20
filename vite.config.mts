import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { config } from "@be-config";
import { visualizer } from "rollup-plugin-visualizer";
import {
  vueNnnRouterPlugin,
  vueNnnRouterNamesPlugin,
  vueNnnRouterScrollPlugin,
} from "vue-nnn-router/vite";

export default defineConfig({
  plugins: [
    frontendEntryFallbackPlugin(),
    vue(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    vueNnnRouterPlugin(),
    vueNnnRouterNamesPlugin({
      rootPath: "views/vue-public",
      outFile: "constants/router-name.ts",
    }),
    vueNnnRouterScrollPlugin({
      rootPath: "views/vue-public",
      outFile: "constants/router-scroll.ts",
    }),
    vueNnnRouterNamesPlugin({
      rootPath: "views/vue-admin",
      prefix: "/admin",
      outFile: "constants/router-name.ts",
    }),
    vueNnnRouterScrollPlugin({
      rootPath: "views/vue-admin",
      outFile: "constants/router-scroll.ts",
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${resolve(import.meta.dirname, "views/vue-shared/styles/main.scss")}" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "."),
      "@fe-public": resolve(import.meta.dirname, "views/vue-public"),
      "@fe-admin": resolve(import.meta.dirname, "views/vue-admin"),
      "@fe-member": resolve(import.meta.dirname, "views/vue-member"),
      "@fe-shared": resolve(import.meta.dirname, "views/vue-shared"),
      "@fe-assets": resolve(import.meta.dirname, "public"),
    },
  },
  optimizeDeps: {
    include: ["vue"],
    exclude: ["date-fns"],
  },
  publicDir: "public",
  build: {
    // Preserve Vite 5's browser targets when upgrading the bundler.
    target: ["chrome87", "edge88", "firefox78", "safari14"],
    outDir: "dist/frontend",
    manifest: true,
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        public: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
      },
      output: {
        codeSplitting: {
          groups: [
            "vue",
            "vue-router",
            "pinia",
            "date-fns",
            "ky",
            "@vuelidate/core",
            "@vuelidate/validators",
            "@kyvg/vue3-notification",
            "pica",
            "pica-resize-image",
            "heic2any",
          ].map((name) => ({
            name,
            test: (id: string) => id.includes(`/node_modules/${name}/`),
            // Keep modules used only by admin out of public entry chunks.
            entriesAware: true,
          })),
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  server: {
    port: config.vite.devPort,
  },
});

function frontendEntryFallbackPlugin(): Plugin {
  return {
    name: "frontend-entry-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!isHtmlNavigation(req)) return next();

        const url = new URL(req.url!, "http://vite.local");

        if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
          req.url = `/admin.html${url.search}`;
        }

        next();
      });
    },
  };
}

function isHtmlNavigation(req: {
  method?: string;
  url?: string;
  headers: { accept?: string };
}): boolean {
  if (!req.url) return false;
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  return req.headers.accept?.includes("text/html") ?? false;
}
