<div align="center">

# Leaf — Bun + Elysia + Vue 3 Full-Stack Starter

**SSR hiệu năng cao với template Blade, routing theo file và Vue 3 hydrate.**

[English](./README.md) · **Tiếng Việt**

</div>

---

## Tổng quan

Leaf là starter full-stack chạy trên **Bun + Elysia (backend)** và **Vue 3 + Vite (frontend)**. Tầng SSR dùng template kiểu **Blade** (qua [`leaf-blade`](https://www.npmjs.com/package/leaf-blade)) làm shell, sau đó **Vue 3 hydrate** lên trên. Routing ở cả server và client đều **dựa trên cấu trúc thư mục** nhờ `elysia-nnn-router` (server) và `vue-nnn-router` (client).

## Điểm nổi bật

- **Chạy native trên Bun** — cold-start nhanh, thực thi TS trực tiếp, dùng `Bun.file()` cho I/O.
- **Elysia v1.4** với `Context` được type-safe.
- **Routing theo file** cho cả server (`routes/**`) và client (`views/vue/pages/**`).
- **Template Blade** (`@extends`, `@section`, `@yield`, `@include`, `@foreach`) cho phần SSR.
- **Vite 5** cho frontend Vue, tự động inject SCSS variables/mixins.
- **SEO sẵn sàng**: meta động, Open Graph, Twitter Cards, JSON-LD, `/sitemap.xml`, `/robots.txt` (qua [`leaf-seo`](https://www.npmjs.com/package/leaf-seo)).
- **Prisma 7** (PostgreSQL) với `@prisma/adapter-pg`.
- **Middleware SSR thông minh** đọc Vite manifest và inject asset đã hash vào layout Blade (cache ở production, single-flight loader).
- **TypeScript strict** với hệ alias đầy đủ cho cả backend (`@be-*`) và frontend (`@fe-*`).

## Stack công nghệ

| Tầng | Công nghệ |
|---|---|
| Runtime | Bun |
| Web framework | Elysia 1.4 |
| Routing | `elysia-nnn-router` (server) · `vue-nnn-router` (client) |
| Template SSR | `leaf-blade` |
| SEO | `leaf-seo` |
| Frontend | Vue 3, Vue Router 4, Pinia, Vite 5 |
| Styling | SCSS (Sass modern API), `@use`/`@forward` |
| HTTP client | `ky` |
| Icon | FontAwesome (`@fortawesome/vue-fontawesome`) |
| Notification | `@kyvg/vue3-notification` |
| Validation | `@vuelidate/core`, `@vuelidate/validators` |
| Database | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) |
| Ngôn ngữ | TypeScript 5 (strict) |

## Cấu trúc dự án

```text
.
├── server.ts                  # Entry app (Elysia)
├── config/                    # Config tập trung, type-safe
├── database.ts                # Prisma client (kèm pg adapter)
├── middlewares/
│   └── ssr.ts                 # Inject asset Vite manifest vào ctx.vite
├── plugins/                   # Elysia plugins (blade, error-handler, logger, …)
├── routes/                    # Route theo file
│   ├── api/                   # → /api/*
│   ├── health/                # → /health
│   ├── robots/                # → /robots.txt
│   ├── sitemap/               # → /sitemap.xml
│   └── ssr/                   # → catch-all SSR (render Blade + Vue shell)
├── helpers/seo.ts             # Factory SEO trên nền leaf-seo
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── tables/users.ts
├── types/
│   ├── leaf.ts                # LeafContext, ViteAssets
│   └── vue.d.ts
├── views/
│   ├── blade/                 # Template SSR Blade
│   │   ├── layouts/app.blade.html
│   │   ├── partials/{header,footer}.blade.html
│   │   └── {home,about,post,common}.blade.html
│   └── vue/                   # Vue SPA
│       ├── app.vue
│       ├── main.ts
│       ├── pages/             # Route phía client (file-based)
│       ├── plugins/           # nnn-router, pinia, ky, font-awesome
│       └── styles/            # SCSS variables, colors, mixins
├── index.html                 # Entry Vite dev
├── vite.config.mts
├── tsconfig.json
└── prisma.config.ts
```

## Khởi động nhanh

Yêu cầu **Bun >= 1.1** và **PostgreSQL** đang chạy (hoặc có sẵn `DATABASE_URL`).

```bash
# 1. Cài deps
bun install

# 2. Cấu hình environment
cp .env.example .env
# sửa DATABASE_URL, BASE_URL, CORS_ORIGIN, …

# 3. (Lần đầu) Generate Prisma client + seed
bunx prisma generate
bunx prisma migrate dev
bun run prisma/seed.ts

# 4. Chạy dev (backend + Vite watch song song)
bun run dev

# Backend:    http://localhost:5000
# Vite dev:   http://localhost:3000
```

## Scripts

| Script | Mô tả |
|---|---|
| `bun run dev` | Chạy song song backend (watch) và Vite build watch |
| `bun run be` | Chỉ chạy backend dev (auto reload qua nodemon) |
| `bun run fe` | Vite dev server |
| `bun run watch` | Vite build watch mode (xuất ra `dist/fe`) |
| `bun run build:fe` | Build FE production |
| `bun run build:be` | Bundle backend với `bun build` |
| `bun run build` | `build:fe` + `build:be` |
| `bun run start` | Chạy file đã build `dist/server.js` |

## Biến môi trường

Được khai báo trong `config/index.ts`, đọc từ `.env`:

| Biến | Mặc định | Mục đích |
|---|---|---|
| `PORT` | `5000` | Cổng backend |
| `NODE_ENV` | `development` | Bật/tắt cache, chi tiết lỗi, robots policy |
| `VITE_PORT` | `3000` | Cổng Vite dev server |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5000` | Origin CORS, ngăn cách bằng dấu phẩy |
| `DATABASE_URL` | — | Chuỗi kết nối PostgreSQL (**bắt buộc**) |
| `BASE_URL` | `http://localhost:5000` | URL gốc cho sitemap, canonical |
| `SITE_NAME` | `Leaf App` | Tên site cho SEO meta |
| `DEFAULT_OG_IMAGE` | `/og-default.jpg` | OG image mặc định |
| `SITE_LOCALE` | `vi_VN` | Locale mặc định |
| `TWITTER_HANDLE` | — | Twitter handle cho Twitter Card |
| `BLADE_VIEWS_DIR` | `views/blade` | Đổi thư mục Blade nếu cần |

## Path Aliases

Backend (qua `tsconfig.json`):

```
@be-config           → ./config/index
@be-config/*         → ./config/*
@be-types/*          → ./types/*
@be-plugins/*        → ./plugins/*
@be-middlewares/*    → ./middlewares/*
@be-routes/*         → ./routes/*
@be-helpers/*        → ./helpers/*
@be-utils/*          → ./utils/*
@be-services/*       → ./services/*
@be-engines/*        → ./engines/*
```

Frontend (đồng bộ giữa `vite.config.mts` và `tsconfig.json`):

```
@                    → root repo
@fe/*                → ./views/vue/*
@fe-pages/*          → ./views/vue/pages/*
@fe-plugins/*        → ./views/vue/plugins/*
@fe-components/*     → ./views/vue/components/*
@fe-stores/*         → ./views/vue/stores/*
@fe-routes/*         → ./views/vue/routes/*
@fe-utils/*          → ./views/vue/utils/*
@fe-helpers/*        → ./views/vue/helpers/*
@fe-types/*          → ./views/vue/types/*
@fe-constants/*      → ./views/vue/constants/*
@fe-assets/*         → ./public/*
```

## Luồng render

1. **`server.ts`** gắn error handler, CORS, Blade plugin, static, và mount từng folder route khai báo trong `config.routes` qua `nnnRouterPlugin`.
2. Mỗi request vào `/ssr/*` đi qua `routes/ssr/_middleware.ts` → `middlewares/ssr.ts`. Middleware này đọc `dist/fe/.vite/manifest.json` (async, cache ở prod, single-flight), resolve entry chunk + toàn bộ nested imports, và gán `ctx.vite = { main, css[], imports[] }`.
3. **`views/blade/layouts/app.blade.html`** dùng `ctx.vite` để phát ra `<link rel="stylesheet">` cho mỗi CSS chunk, `<link rel="modulepreload">` cho mỗi JS chunk import, và `<script type="module">` cho entry hydrate.
4. **`views/vue/main.ts`** khởi tạo Vue 3 với Vue Router, Pinia, `v-wave`, `Notifications`, FontAwesome. `views/vue/plugins/nnn-router.ts` build route từ `views/vue/pages/**` qua `import.meta.glob`.

## SEO

Có sẵn:

- `/sitemap.xml` — sitemap XML (mở rộng trong `routes/sitemap/get.ts`).
- `/robots.txt` — tự đổi theo env (`Disallow: /` ở dev, allow-list ở prod).
- `helpers/seo.ts` — wrap `leaf-seo` (`generateMetaTags`, `generateSchemaScripts`, `renderHead`) và expose một hàm `generateSeo(options, html?)`.
- Blade `layouts/app.blade.html` đã sẵn `@section('seo')` để inject meta theo từng trang.

## Lưu ý hiệu năng

- Middleware SSR chỉ đọc Vite manifest **một lần** ở runtime production, sau đó giữ trong memory; các request đầu tiên chạy đồng thời đều dùng chung một promise (single-flight).
- Blade engine cache template đã compile ở production (`config.blade.cache = true`).
- Vite cấu hình manual chunk cho `vue`, `vue-router`, `pinia`, `date-fns`, `ky` và một vài lib lớn, kèm visualizer (`dist/fe/stats.html`).
- `optimizeDeps.include: ['vue']` giúp warm pre-bundle.

## Roadmap

- [ ] Rate limiting (`@elysiajs/rate-limit` hoặc tự viết).
- [ ] Validation input bằng Elysia validators / Zod cho `/api/*`.
- [ ] Auth (JWT hoặc session) + route được bảo vệ.
- [ ] Test với `bun test` cho Blade render, manifest middleware, helpers.
- [ ] Script ESLint + Prettier, pre-commit hook.
- [ ] Streaming SSR cho nội dung trên fold.
- [ ] Nén HTTP (gzip/brotli) cho response không phải static.

## Giấy phép

ISC (xem `package.json`).
