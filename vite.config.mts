import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { config } from "./config";
import { visualizer } from "rollup-plugin-visualizer";
import {
  vueNnnRouterNamesPlugin,
  vueNnnRouterScrollPlugin,
} from "vue-nnn-router/vite";

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    vueNnnRouterNamesPlugin({
      pages: [
        "views/vue-public/pages/**/*.{vue,tsx,jsx,ts,js}",
        "views/vue-public/pages/**/_middleware.ts",
        "views/vue-public/pages/**/_redirect.ts",
      ],
      routesRoot: "views/vue-public/pages",
      outFile: "views/vue-public/constants/router-name.ts",
    }),
    vueNnnRouterScrollPlugin({
      pages: ["views/vue-public/pages/**/*.{vue,tsx,jsx}"],
      outFile: "views/vue-public/constants/router-scroll.ts",
    }),
    vueNnnRouterNamesPlugin({
      pages: [
        "views/vue-admin/pages/**/*.{vue,tsx,jsx,ts,js}",
        "views/vue-admin/pages/**/_middleware.ts",
        "views/vue-admin/pages/**/_redirect.ts",
      ],
      routesRoot: "views/vue-admin/pages",
      outFile: "views/vue-admin/constants/router-name.ts",
    }),
    vueNnnRouterScrollPlugin({
      pages: ["views/vue-admin/pages/**/*.{vue,tsx,jsx}"],
      outFile: "views/vue-admin/constants/router-scroll.ts",
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${resolve(__dirname, "views/vue-shared/styles/main.scss")}" as *;`,
        silenceDeprecations: ["legacy-js-api"],
        api: "modern-compiler",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@fe-public": resolve(__dirname, "views/vue-public"),
      "@fe-admin": resolve(__dirname, "views/vue-admin"),
      "@fe-member": resolve(__dirname, "views/vue-member"),
      "@fe-shared": resolve(__dirname, "views/vue-shared"),
      "@fe-assets": resolve(__dirname, "public"),
    },
  },
  optimizeDeps: {
    include: ["vue"],
    exclude: ["date-fns"],
  },
  publicDir: "public",
  build: {
    outDir: "dist/frontend",
    manifest: true,
    emptyOutDir: true,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      input: {
        public: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/vue/")) return "vue";
          if (id.includes("/node_modules/vue-router/")) return "vue-router";
          if (id.includes("/node_modules/pinia/")) return "pinia";

          if (id.includes("/node_modules/date-fns/")) return "date-fns";
          if (id.includes("/node_modules/ky/")) return "ky";

          // @vuelidate/core
          if (id.includes("/node_modules/@vuelidate/core/"))
            return "@vuelidate/core";
          if (id.includes("/node_modules/@vuelidate/validators/"))
            return "@vuelidate/validators";

          // @kyvg/vue3-notification
          if (id.includes("/node_modules/@kyvg/vue3-notification/"))
            return "@kyvg/vue3-notification";

          // pica
          if (id.includes("/node_modules/pica/")) return "pica";
          // pica-resize-image
          if (id.includes("/node_modules/pica-resize-image/"))
            return "pica-resize-image";
          // heic2any
          if (id.includes("/node_modules/heic2any/")) return "heic2any";
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
