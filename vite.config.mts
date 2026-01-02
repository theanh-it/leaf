import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { config } from "./config";

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        // Modern Sass 3 syntax - tự động inject vào mọi SCSS file
        // Sử dụng @use với index file để forward tất cả variables và mixins
        additionalData: `
          @use "sass:color";
          @use "${resolve(__dirname, "views/vue/styles/index.scss")}" as *;
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
      "@fe-constants": resolve(__dirname, "views/vue/constants"),
      "@fe-helpers": resolve(__dirname, "views/vue/helpers"),
      "@fe-components": resolve(__dirname, "views/vue/components"),
      "@fe-plugins": resolve(__dirname, "plugins"),
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
  },
  publicDir: "public",
  build: {
    outDir: "dist/fe",
    manifest: true,
    emptyOutDir: true,
    minify: "terser",
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
          if (id.includes("/node_modules/@vue/shared/")) return "@vue/shared";
          if (id.includes("/node_modules/@vue/reactivity/"))
            return "@vue/reactivity";
          if (id.includes("/node_modules/@vue/runtime-core/"))
            return "@vue/runtime-core";
          if (id.includes("/node_modules/@vue/runtime-dom/"))
            return "@vue/runtime-dom";
          if (id.includes("/node_modules/@vue/compiler-sfc/"))
            return "@vue/compiler-sfc";
          if (id.includes("/node_modules/vue-router/")) return "vue-router";
          if (id.includes("/node_modules/pinia/")) return "pinia";
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
