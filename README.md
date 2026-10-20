<div align="center">

# Leaf — Bun + Elysia + Vue 3 Full-Stack Starter

**High-performance SSR web stack with Blade templating, file-based routing, and Vue 3 hydration.**

**English** · [Tiếng Việt](./README.vi.md)

</div>

---

## Overview

Leaf is a full-stack starter built on **Bun + Elysia (backend)** and **Vue 3 + Vite (frontend)**. It uses **Blade**-style server templates (via [`leaf-blade`](https://www.npmjs.com/package/leaf-blade)) for SSR shells and hydrates a Vue 3 SPA on top. Routing on both server and client is **file-based** through `elysia-nnn-router` (server) and `vue-nnn-router` (client).

## Highlights

- **Bun-native runtime** — fast cold-start, native TS execution, `Bun.file()` I/O.
- **Elysia v1.4** HTTP framework with typed `Context`.
- **File-based routes** on the server (`routes/**`) and in each Vue app (`views/vue-*/pages/**`).
- **Blade templates** (`@extends`, `@section`, `@yield`, `@include`, `@foreach`) for SSR shells.
- **Vite 8** for the Vue frontend, including SCSS auto-injection of variables/mixins.
- **Built-in SEO**: dynamic meta tags, Open Graph, Twitter Cards, JSON-LD, `/sitemap.xml`, `/robots.txt` (via [`leaf-seo`](https://www.npmjs.com/package/leaf-seo)).
- **Prisma 7** (PostgreSQL) with `@prisma/adapter-pg`.
- **Manifest-aware SSR middleware** that injects hashed Vite assets into the Blade layout (cached in production, single-flight loader).
- **Strict TypeScript** with scoped aliases for backend (`@be-*`) and each frontend app (`@fe-public`, `@fe-admin`, `@fe-shared`).

## Tech Stack

| Layer         | Technology                                               |
| ------------- | -------------------------------------------------------- |
| Runtime       | Bun                                                      |
| Web framework | Elysia 1.4                                               |
| Routing       | `elysia-nnn-router` (server) · `vue-nnn-router` (client) |
| SSR templates | `leaf-blade` (Blade-style for Bun/Elysia)                |
| SEO           | `leaf-seo`                                               |
| Frontend      | Vue 3, Vue Router 4, Pinia, Vite 8                       |
| Styling       | SCSS (modern Sass API), `@use`/`@forward`                |
| HTTP client   | `ky`                                                     |
| Icons         | FontAwesome (`@fortawesome/vue-fontawesome`)             |
| Notifications | `@kyvg/vue3-notification`                                |
| Validation    | `@vuelidate/core`, `@vuelidate/validators`               |
| Database      | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)             |
| Language      | TypeScript 5 (strict mode)                               |

## Project Structure

```text
.
├── server.ts                  # App entry (Elysia)
├── config/                    # Centralised typed config
├── database.ts                # Prisma client (with pg adapter)
├── middlewares/
│   └── ssr.ts                 # Injects Vite manifest assets into ctx.vite
├── plugins/                   # Elysia plugins (blade, error-handler, logger, …)
├── routes/                    # File-based server routes
│   ├── api/                   # → /api/*
│   ├── health/                # → /health
│   ├── robots/                # → /robots.txt
│   ├── sitemap/               # → /sitemap.xml
│   └── ssr/                   # → catch-all SSR (renders Blade + Vue shell)
├── helpers/seo.ts             # SEO factory on top of leaf-seo
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── tables/users.ts
├── types/
│   ├── leaf.ts                # LeafContext, ViteAssets
│   └── vue.d.ts
├── views/
│   ├── blade/                 # Blade SSR templates
│   │   ├── layouts/app.blade.html
│   │   ├── partials/{header,footer}.blade.html
│   │   └── {home,about,post,common}.blade.html
│   ├── vue-public/            # Public Vue application
│   │   ├── app.vue
│   │   ├── main.ts
│   │   ├── pages/
│   │   └── plugins/
│   ├── vue-admin/             # Admin Vue application
│   │   ├── app.vue
│   │   ├── main.ts
│   │   ├── pages/
│   │   ├── components/
│   │   ├── stores/
│   │   └── plugins/
│   ├── vue-member/            # Reserved for the member application
│   └── vue-shared/            # Explicitly shared frontend code and SCSS tokens
├── index.html                 # Public Vite entry
├── admin.html                 # Admin Vite entry
├── vite.config.mts
├── tsconfig.json
└── prisma.config.ts
```

## Quick Start

Requires **Bun >= 1.2.8** and **PostgreSQL** running locally (or a `DATABASE_URL`).

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# then edit DATABASE_URL, BASE_URL, CORS_ORIGIN, …

# 3. (One-time) Generate Prisma client and seed
bun run prisma:generate
bun run prisma:migrate
bun run prisma:seed

# 4. Run dev (backend + Vite watch in parallel)
bun run dev

# Backend only:    http://localhost:5000
# Vite dev server: http://localhost:3000
```

## Scripts

| Script             | What it does                                                 |
| ------------------ | ------------------------------------------------------------ |
| `bun run dev`      | Runs backend (with watch) and Vite build watcher in parallel |
| `bun run be`       | Backend dev only (auto-reload via nodemon)                   |
| `bun run fe`       | Vite dev server                                              |
| `bun run watch`    | Vite build in watch mode (produces `dist/frontend`)          |
| `bun run build:fe` | One-shot Vite production build                               |
| `bun run build:be` | Bundles the server with `bun build`                          |
| `bun run build`    | `build:fe` + `build:be`                                      |
| `bun run start`    | Runs the compiled `dist/server.js`                           |

## Environment Variables

Defined in `config/index.ts`, sourced from `.env`:

| Variable           | Default                                       | Purpose                                         |
| ------------------ | --------------------------------------------- | ----------------------------------------------- |
| `PORT`             | `5000`                                        | Backend HTTP port                               |
| `NODE_ENV`         | `development`                                 | Toggles caching, error verbosity, robots policy |
| `VITE_PORT`        | `3000`                                        | Vite dev server port                            |
| `CORS_ORIGIN`      | `http://localhost:3000,http://localhost:5000` | Comma-separated CORS origins                    |
| `DATABASE_URL`     | —                                             | PostgreSQL connection string (**required**)     |
| `BASE_URL`         | `http://localhost:5000`                       | Used for sitemap, canonical URLs                |
| `SITE_NAME`        | `Leaf App`                                    | Site name in SEO meta                           |
| `DEFAULT_OG_IMAGE` | `/og-default.jpg`                             | Fallback Open Graph image                       |
| `SITE_LOCALE`      | `vi_VN`                                       | Default locale                                  |
| `TWITTER_HANDLE`   | —                                             | Twitter handle for cards                        |
| `BLADE_VIEWS_DIR`  | `views/blade`                                 | Override Blade templates folder                 |

## Path Aliases

Backend (consumed via `tsconfig.json` paths):

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

Frontend (mirrored in `vite.config.mts` and `tsconfig.json`):

```
@                    → repository root
@fe-public/*         → ./views/vue-public/*
@fe-admin/*          → ./views/vue-admin/*
@fe-member/*         → ./views/vue-member/*
@fe-shared/*         → ./views/vue-shared/*
@fe-assets/*         → ./public/*
```

## How Rendering Works

1. **`server.ts`** mounts the error handler, CORS, Blade plugin, static files, and registers each routes folder declared in `config.routes` through `nnnRouterPlugin`.
2. **`/ssr/*`** routes pass through `routes/ssr/_middleware.ts` → `middlewares/ssr.ts`. `/login` redirects to `/admin/login`; the middleware selects the admin entry for `/admin` and `/admin/*`, selects the public entry for other pages, and exposes `ctx.vite = { main, css[], imports[] }`.
3. **`views/blade/layouts/app.blade.html`** consumes `ctx.vite`, emitting `<link rel="stylesheet">` for every CSS chunk, `<link rel="modulepreload">` for every imported JS chunk, and the entry `<script type="module">` for hydration.
4. **`views/vue-public/main.ts`** and **`views/vue-admin/main.ts`** boot independent Vue applications. Each router scans only its own `pages/**` tree, so public requests cannot load admin application logic.

## SEO

Out of the box:

- `/sitemap.xml` — generated XML sitemap (extendable in `routes/sitemap/get.ts`).
- `/robots.txt` — production-aware (`Disallow: /` in dev, allow-list in prod).
- `helpers/seo.ts` — wraps `leaf-seo` (`generateMetaTags`, `generateSchemaScripts`, `renderHead`) and exposes a single `generateSeo(options, html?)` helper.
- Blade `layouts/app.blade.html` already yields `@section('seo')` for per-page tags.

## Performance Notes

- The SSR middleware loads the Vite manifest only **once** at runtime in production, then keeps it in memory; concurrent first requests share a single in-flight promise.
- The Blade engine caches compiled templates in production (`config.blade.cache = true`).
- Vite builds independent public/admin entries and configures manual chunks for common libraries without a catch-all vendor bundle. The bundle visualizer is written to `dist/stats.html`.
- `optimizeDeps.include: ['vue']` warms Vite pre-bundling.

## Validation and deployment

- `bun run typecheck` checks TypeScript and Vue templates with `vue-tsc`.
- Test paths mirror source paths: `helpers/image.ts` → `tests/helpers/image.test.ts`, `routes/api/users/[id]/put.ts` → `tests/routes/api/users/[id]/put.test.ts`. Directory names, HTTP methods, `_middleware`, and `[id]` are preserved; `tests/support/` contains environment setup only. See the [source-to-test and coverage map](tests/README.md).
- Run `bun run test` for the full suite, or `bun run test:helpers`, `bun run test:middlewares`, `bun run test:routes`, `bun run test:backup`, and `bun run test:server` by source directory.
- `bun test` runs unit and integration tests. Set `TEST_POSTGRES_BIN` to the directory containing `initdb`, `postgres`, `pg_dump`, `pg_restore`, and `psql` for the full PostgreSQL suite. Tests create isolated temporary clusters and do not use the database in `.env`. Missing binaries skip database tests locally; CI requires them.
- `bun run build` stops if the frontend build fails. The backend build and `bun run start` set `NODE_ENV=production` so the bundle does not retain development behavior. GitHub Actions runs typecheck, all tests, and the build with Bun 1.2.8/PostgreSQL 16.
- Before production, set `NODE_ENV=production`, a strong random `JWT_SECRET`, `DATABASE_URL`, `BASE_URL`, `VITE_API_URL`, and explicit `CORS_ORIGIN` values. Frontend `VITE_*` values are embedded at build time.
- Run `bun run prisma:migrate:production`, build, then `bun run start`. Deploy `routes/`, `views/blade/`, `public/`, the Prisma client/dependencies, and `dist/` because routes and templates load at runtime. Persist `files/`, `backup/`, and `storage/`; configure HTTPS and uploaded-file serving at the reverse proxy where needed.
- `GET /health` is liveness. `GET /health/ready` checks the database and returns 503 when it is unavailable or a restore is running; use it for load-balancer readiness.

## Authentication and users API

- `requiredLogin` loads the current user with `USER_PUBLIC_SELECT` and accepts only `active` accounts. `requiredAdmin` checks `type === "admin"`, independent of username or stale JWT claims. Profile and user responses omit password hashes.
- Login accepts `remember: boolean` (default false): tokens last one day, or seven days when remembered. New passwords require at least six characters and at most 72 UTF-8 bytes to avoid bcrypt truncation.
- Public registration always creates a `customer/pending` account; an administrator must activate it before login. Concurrent username conflicts return a field error. Default limits: 10 login and 5 registration requests per minute per IP.
- Rate limiting uses the socket IP by default and ignores client-supplied IP headers. Set `TRUSTED_PROXY_IPS` only to exact socket IPs of trusted reverse proxies, which must overwrite or append the source IP to `X-Forwarded-For`. The chain is walked right to left until the first untrusted hop. Rate-limit storage and backup/restore locks are process-local; add shared coordination before deploying multiple replicas.
- `GET /api/users` accepts `page`, `limit` (1–100, default 20), `search`, `type`, and `status`. Its `result` is `{ items, pagination: { page, limit, totalRecords, totalPages } }`; update older clients that expected an array.

## Roadmap

- [x] JWT authentication, current account role/status checks, and protected routes.
- [x] Zod validation and rate limiting for login/registration.
- [x] User CRUD, server pagination, search, and filters.
- [x] Auth, authorization, CRUD, upload, and backup/restore tests; CI and Vue typechecking.
- [ ] Email password recovery; the login page currently directs users to an administrator.
- [ ] Server-side session revocation on logout/password changes; logout currently removes browser tokens, while JWTs retain their own expiry.
- [ ] Blade rendering and Vite manifest middleware tests.
- [ ] ESLint, repository-wide formatting checks, and pre-commit hooks.
- [ ] Streaming SSR and compression for non-static HTTP responses.

## License

ISC (see `package.json`).
