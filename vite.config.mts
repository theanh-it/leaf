import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { config } from "./config";
import { visualizer } from "rollup-plugin-visualizer";
import { vueNnnRouterNamesPlugin } from "vue-nnn-router/vite";

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
        "views/vue/pages/**/*.{vue,tsx,jsx,ts,js}",
        "views/vue/pages/**/_middleware.ts",
        "views/vue/pages/**/_redirect.ts",
      ],
      routesRoot: "views/vue/pages",
      outFile: "views/vue/constants/router-name.ts", // tùy chọn — mặc định
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Modern Sass 3 syntax - tự động inject vào mọi SCSS file
        // Sử dụng @use với index file để forward tất cả variables và mixins
        additionalData: `
          @use "${resolve(__dirname, "views/vue/styles/main.scss")}" as *;
        `,
        // Suppress deprecation warnings
        silenceDeprecations: ["legacy-js-api"],
        // Sử dụng modern Sass API
        api: "modern-compiler",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@fe": resolve(__dirname, "views/vue"),
      "@fe-apis": resolve(__dirname, "views/vue/apis"),
      "@fe-constants": resolve(__dirname, "views/vue/constants"),
      "@fe-composables": resolve(__dirname, "views/vue/composables"),
      "@fe-helpers": resolve(__dirname, "views/vue/helpers"),
      "@fe-components": resolve(__dirname, "views/vue/components"),
      "@fe-layouts": resolve(__dirname, "views/vue/layouts"),
      "@fe-plugins": resolve(__dirname, "views/vue/plugins"),
      "@fe-stores": resolve(__dirname, "views/vue/stores"),
      "@fe-routes": resolve(__dirname, "views/vue/routes"),
      "@fe-pages": resolve(__dirname, "views/vue/pages"),
      "@fe-utils": resolve(__dirname, "views/vue/utils"),
      "@fe-types": resolve(__dirname, "views/vue/types"),
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
      input: resolve(__dirname, "index.html"),
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

          if (id.includes("node_modules")) return "vendor";
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
