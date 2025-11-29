import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

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
      // Frontend aliases
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
      // Backend aliases (for shared types/utils if needed)
      "@be": resolve(__dirname, "."),
      "@be-types": resolve(__dirname, "types"),
      "@be-plugins": resolve(__dirname, "plugins"),
      "@be-routes": resolve(__dirname, "routes"),
      "@be-config": resolve(__dirname, "config"),
      "@be-helpers": resolve(__dirname, "helpers"),
      "@be-utils": resolve(__dirname, "utils"),
      "@be-services": resolve(__dirname, "services"),
    },
  },
  optimizeDeps: {
    include: ["vue"],
  },
  publicDir: "public",
  build: {
    outDir: "dist",
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
    },
  },
  server: {
    port: 3000,
  },
});
