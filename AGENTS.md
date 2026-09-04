# Leaf Project Guidelines

## Công nghệ (Tech Stack)

| Layer             | Technology                                                                        |
| ----------------- | --------------------------------------------------------------------------------- |
| Runtime           | **Bun** (không dùng Node.js)                                                      |
| Backend Framework | **Elysia** (Bun-native)                                                           |
| Frontend          | **Vue 3** (Composition API + `<script setup>`) + **Vite**                         |
| CSS               | **SCSS** (Sass modern-compiler API) + [**RSCSS**](https://ricostacruz.com/rscss/) |
| Database ORM      | **Prisma** + PostgreSQL (`@prisma/adapter-pg`)                                    |
| Validation        | **Zod v4** (BE) + **Vuelidate** (FE)                                              |
| Auth              | **JWT** (`jsonwebtoken`) + **bcrypt**                                             |
| State Management  | **Pinia**                                                                         |
| HTTP Client (FE)  | **ky**                                                                            |
| Package Manager   | **bun** (không npm/yarn/pnpm)                                                     |
| Formatting        | **Prettier**                                                                      |

---

## Cấu trúc thư mục

```
leaf/
├── server.ts              # Entry point - Elysia server
├── database.ts            # Prisma client + pg Pool singleton
├── config/index.ts        # Toàn bộ config tập trung
├── constants/             # Hằng số shared (JWT_EXPIRES_IN, STATUS_RESPONSE, MESSAGE)
├── types/                 # TypeScript types/interface dùng chung
├── helpers/               # Utility functions (auth, password, response, request, file, user, seo, stream)
├── middlewares/           # Elysia middlewares (rate-limit, required-login, required-admin, ssr, verify-token)
├── plugins/               # Elysia plugins (blade, error-handler, logger, response-helper)
├── routes/                # File-based routing với elysia-nnn-router
│   ├── api/               #   /api/*
│   ├── health/            #   /health
│   ├── robots/            #   /robots.txt
│   ├── sitemap/           #   /sitemap.xml
│   └── ssr/               #   / (SSR pages)
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data
│   └── tables/            # Table-level seed data + type definitions
├── views/
│   ├── blade/             # Server-side Blade templates (SSR)
│   │   ├── layouts/       # Layout kế thừa
│   │   └── partials/      # Header, footer, etc.
│   ├── vue-public/        # Public Vue app (entry + router độc lập)
│   │   ├── pages/         # Public file-based pages
│   │   └── plugins/       # Public-only Vue plugins
│   ├── vue-admin/         # Admin Vue app (entry + router độc lập)
│   │   ├── pages/         # Login và admin file-based pages
│   │   ├── components/    # Admin-only components
│   │   ├── composables/   # Admin-only composables
│   │   ├── stores/        # Admin Pinia stores
│   │   ├── apis/          # Admin API calls
│   │   ├── plugins/       # Admin plugins
│   │   ├── layouts/       # Admin layouts
│   │   ├── styles/        # Admin global styles
│   │   ├── constants/     # Admin constants
│   │   ├── helpers/       # Admin helpers
│   │   ├── types/         # Admin types
│   │   └── utils/         # Admin utilities
│   ├── vue-member/        # Placeholder cho member app sau này
│   └── vue-shared/        # Chỉ chứa code/token thực sự dùng chung
│       └── styles/        # SCSS variables, mixins, colors
└── public/                # Static assets
```

---

## Path Aliases

Luôn dùng alias khi import. **Tuyệt đối không** dùng relative path `../../`.

| Alias               | Path                    | Usage                |
| ------------------- | ----------------------- | -------------------- |
| `@/*`               | `./*`                   | Root                 |
| `@be-config`        | `./config/index`        | Backend config       |
| `@be-helpers/*`     | `./helpers/*`           | Backend helpers      |
| `@be-plugins/*`     | `./plugins/*`           | Backend plugins      |
| `@be-middlewares/*` | `./middlewares/*`       | Backend middlewares  |
| `@be-routes/*`      | `./routes/*`            | Backend routes       |
| `@fe-public/*`      | `./views/vue-public/*`  | Public Vue app       |
| `@fe-admin/*`       | `./views/vue-admin/*`   | Admin Vue app        |
| `@fe-member/*`      | `./views/vue-member/*`  | Member Vue app       |
| `@fe-shared/*`      | `./views/vue-shared/*`  | Shared frontend code |
| `@fe-assets/*`      | `./public/*`            | Static public assets |

### Frontend isolation

- `vue-public`, `vue-admin` và `vue-member` là các ứng dụng Vue độc lập, mỗi app có `main.ts`, router và page tree riêng.
- Không import trực tiếp từ app này sang app khác. Code dùng chung phải chuyển vào `vue-shared` và import qua `@fe-shared/*`.
- Chỉ đưa code thật sự dùng bởi ít nhất hai app vào `vue-shared`; business logic theo role phải nằm trong app tương ứng.
- Khi thêm frontend role mới, phải thêm Vite entry, router-name/scroll plugin và mapping entry trong `middlewares/ssr.ts`.
- Không dùng manual chunk catch-all cho toàn bộ `node_modules`, vì có thể kéo dependency riêng của admin vào lượt tải public.

---

## Quy ước Backend

### Route handler (file-based routing với `elysia-nnn-router`)

Mỗi file trong `routes/` export default một async function nhận `Context` từ Elysia. Luồng chuẩn: **validate → business logic → response**.

```typescript
import type { Context } from "elysia";
import { z } from "zod";
import { prisma } from "@/database";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default async (context: Context) => {
  const body = context.body as z.infer<typeof schema>;

  // 1. Validate input
  const resultValidate = await validateData(body, schema);
  if (resultValidate.errors) {
    return context.status(422, createErrorMessage({
      message: "validation.error",
      result: resultValidate.errors,
    }));
  }

  // 2. Business logic với Prisma
  const data = resultValidate.output;
  const user = await prisma.user.findFirst({ where: { ... } });

  // 3. Trả về response chuẩn
  return createSuccessMessage({ message: "...", result: user });
};
```

### Tổ chức code trong route handler

Khi logic của function chính quá dài, tách thành các function con và đặt **phía dưới** function chính (không đặt phía trên). Function chính giống như "mục lục" — mỗi dòng là một bước.

```typescript
export default async (context: Context) => {
  const body = context.body as LoginBody;

  const validationError = validateInput(body);
  if (validationError) return validationError;

  const user = await findUser(body.username);
  if (isErrorResponse(user)) return user;

  return await processLogin(body, user);
};

// ─── Function con đặt phía dưới ─────────────────────────────

function validateInput(body: LoginBody) {
  const result = validateData(body, schema);
  if (result.errors) {
    return createErrorMessage({
      message: "validation.error",
      result: result.errors,
    });
  }
  return null;
}

async function findUser(username: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }, { phone: username }] },
  });
  if (!user) {
    return createErrorMessage({
      message: "login.failed",
      result: { username: "login.usernameNotFound" },
    });
  }
  return user;
}

async function processLogin(body: LoginBody, user: User) {
  const isPasswordValid = await comparePassword(body.password, user.password);
  if (!isPasswordValid) {
    return createErrorMessage({
      message: "login.failed",
      result: { password: "login.passwordNotMatch" },
    });
  }
  const token = await signJWT(
    { id: user.id, username: user.username, deviceId: body.deviceId },
    true
  );
  return createSuccessMessage({
    message: "login.success",
    result: { token, user: { id: user.id, username: user.username } },
  });
}
```

### Response format

Luôn dùng `createSuccessMessage()` và `createErrorMessage()` từ `@/helpers/response`:

```typescript
// Success
{ status: "success", message: "...", result: { ... } }

// Error
{ status: "error", message: "...", result: { ... } }

// Validation Error
{ status: "validation_error", message: "validation.error", result: { field: "message" } }
```

### Validation (Backend)

Mọi input từ client phải được validate qua `validateData()` từ `@/helpers/request`. Hàm trả về `{ output, errors }` — `errors` là `null` nếu hợp lệ, ngược lại là object `{ field: message }`. Dùng `result.output` để lấy dữ liệu đã được parse và strip field thừa.

### User Data Safety

Luôn dùng `USER_PUBLIC_SELECT` khi query user để không expose `password`:

```typescript
import { USER_PUBLIC_SELECT } from "@/helpers/user";

const user = await prisma.user.findUnique({
  where: { id },
  select: USER_PUBLIC_SELECT, // Không có password
});
```

Xử lý unique constraint error với `getUniqueFieldError`:

```typescript
try {
  await prisma.user.create({ data });
} catch (error) {
  const field = getUniqueFieldError(error); // "username" | "email" | "phone" | null
  if (field) {
    return createErrorMessage({
      result: { [field]: `users.${field}AlreadyExists` },
    });
  }
  throw error;
}
```

Dùng `emptyToNull` để chuyển string rỗng `""` thành `null` trước khi insert vào DB:

```typescript
import { emptyToNull } from "@/helpers/user";
data: {
  email: emptyToNull(body.email);
} // "" → null
```

### Middleware pattern

Middleware trong `middlewares/` export default async function nhận `Context`. Gán dữ liệu vào context qua `Object.assign(context, { user })`.

Các middleware có sẵn:

| Middleware      | File                | Chức năng                                   |
| --------------- | ------------------- | ------------------------------------------- |
| `requiredLogin` | `required-login.ts` | Kiểm tra JWT token, gán `context.user`      |
| `requiredAdmin` | `required-admin.ts` | Kiểm tra `context.user.type === "admin"`    |
| `requiredUser`  | `required-user.ts`  | Kiểm tra `context.user.id` tồn tại          |
| `verifyToken`   | `verify-token.ts`   | Verify token không bắt buộc (không trả lỗi) |
| `rateLimit`     | `rate-limit.ts`     | Giới hạn request theo IP                    |
| `ssrMiddleware` | `ssr.ts`            | Load Vite manifest cho SSR                  |

Sử dụng trong `_middleware.ts`:

```typescript
import requiredLogin from "@/middlewares/required-login";
import requiredAdmin from "@/middlewares/required-admin";

export default [requiredLogin, requiredAdmin];
```

### Rate Limiting

Middleware `@/middlewares/rate-limit` hỗ trợ giới hạn request theo IP:

```typescript
import rateLimit from "@/middlewares/rate-limit";

const loginRateLimit = rateLimit({
  windowMs: 60_000, // Cửa sổ thời gian (ms) — mặc định 1 phút
  max: 10, // Số request tối đa — mặc định 60
  prefix: "login", // Namespace (bắt buộc để tránh trùng giữa các limiter)
  message: "rateLimit.loginExceeded",
  statusCode: 429, // Mặc định 429
});

export default [loginRateLimit];
```

- Mỗi limiter phải có `prefix` riêng
- Luôn đặt rate limit cho route nhạy cảm: login, register

### Plugin pattern

Elysia plugin trong `plugins/` export function trả về `(app: Elysia) => Elysia`:

```typescript
export const myPlugin = (options?: Options) => (app: Elysia) => {
  return app.derive(...) // hoặc .onError, .onRequest, etc.
};
```

### Logger

Dùng `logger` từ `@/plugins/logger` (JSON structured logging) thay vì `console.log`:

```typescript
import { logger } from "@be-plugins/logger";

logger.info("User logged in", { userId: user.id });
logger.warn("Rate limit approaching", { ip, count });
logger.error("Database connection failed", { error: err.message });
logger.debug("Debug info", { ... }); // Chỉ log khi NODE_ENV=development
```

### Auth flow

1. `helpers/auth.ts` — `signJWT(payload, remember?)` và `verifyToken(token)`
2. Token lưu trong `Authorization: Bearer <token>` header
3. `helpers/request.ts` — `getToken(context)` để extract token
4. JWT expire: 1 ngày (mặc định) hoặc 1 tuần (remember me)

### File Upload

Sử dụng `@/helpers/file` (dựa trên Bun File API). File được lưu vào `./files/<folder>/`:

```typescript
import { uploadFile, uploadFiles } from "@/helpers/file";

// Upload 1 file
const file = await uploadFile(fileObject, {
  folder: "avatars",
  name: "random", // "random" (uuid) | "original" (tên gốc) | "custom-name"
});
// → file.path: "avatars/<uuid>.<ext>"

// Upload nhiều file
const files = await uploadFiles(fileArray, { folder: "images" });

// Lấy file từ body
import { getFilesFromBody } from "@/helpers/request";
const { avatar, images } = getFilesFromBody(context.body);
```

- File lưu trong `./files/`, tự động tạo thư mục nếu chưa có
- Tên file mặc định là UUID v7
- Frontend truy cập ảnh qua: `{VITE_API_URL}/files/images/<filename>`

### Blade View & SEO

Khi Blade view cần SEO, dùng `generateSeo` từ `@/helpers/seo` thay vì viết thủ công từng thẻ `<meta>`.

**Route handler** gọi `generateSeo` với `html=true`:

```typescript
import { bladeView } from "leaf-blade";
import { generateSeo } from "@/helpers/seo";
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  const seoHtml = generateSeo(
    {
      title: "Giới thiệu - Leaf Framework",
      description: "Leaf là một web framework hiện đại cho Bun.",
      keywords: ["leaf", "framework", "bun"],
      image: "https://example.com/og-about.jpg",
      canonical: "https://example.com/about",
    },
    true // html=true → trả về chuỗi <title> + <meta> + <script type="application/ld+json">
  );

  return bladeView(ctx, "about", { title: "Giới thiệu", seoHtml });
};
```

**Blade page** output `{{ seoHtml }}` trong section `seo`:

```html
@extends('layouts.app') @section('title') {{ title }} @endsection
@section('seo') {{ seoHtml }} @endsection @section('content')
<h1>Giới thiệu</h1>
@endsection
```

**Quy tắc:**

- Base config chung đặt trong `helpers/seo.ts`, chỉ override option khác biệt ở từng trang
- `{{ seoHtml }}` không escape (dùng `{{ }}` thay vì `{{{ }}}`)
- Luôn set ít nhất `title` + `description`

### SSE (Server-Sent Events)

Dùng `SSEController` từ `@/helpers/stream`:

```typescript
import { SSEController } from "@/helpers/stream";

export default async (context: Context) => {
  const stream = new ReadableStream({ ... });
  const sse = new SSEController(context, stream);

  sse.send("text data");
  sse.json({ type: "update", data: { ... } });
  sse.event("userJoined", { userId: "123" }); // Named event

  if (!sse.isAlive) return; // Kiểm tra trước khi gửi

  sse.close();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
```

- `SSEController` tự cleanup khi client disconnect (qua `AbortSignal`)
- Dùng `sse.event(name, data)` để client dùng `addEventListener`

### Vite Manifest & SSR Middleware

Middleware `@/middlewares/ssr` tự động load Vite manifest để inject CSS/JS vào Blade views. Luôn thêm vào `routes/ssr/_middleware.ts`:

```typescript
import { ssrMiddleware } from "@be-middlewares/ssr";
export default [ssrMiddleware];
```

- Production: cache manifest; Development: đọc mới mỗi request
- `/login`, `/admin` và `/admin/*` dùng entry admin; route còn lại dùng entry public
- Blade layout dùng `{{ vite.main }}`, `{{ vite.css }}`, `{{ vite.imports }}`

---

## Quy ước Frontend

### Vue File-based Routing (`vue-nnn-router`)

Mỗi Vue app có router độc lập, sinh từ `views/vue-[role]/pages/`. Không quét page của app khác. Các file đặc biệt:

| File             | Vai trò                    | Ví dụ                        |
| ---------------- | -------------------------- | ---------------------------- |
| `_layout.vue`    | Layout bọc tất cả page con | `<AdminLayout />`            |
| `_middleware.ts` | Navigation guard           | Kiểm tra `isLoggedIn`        |
| `_redirect.ts`   | Redirect tự động           | `export default "dashboard"` |

Cấu trúc admin trong `views/vue-admin/pages/`:

```
pages/admin/
├── _layout.vue          ← Bọc AdminLayout
├── _middleware.ts       ← Kiểm tra đăng nhập
├── _redirect.ts         ← /admin → /admin/dashboard
├── dashboard.vue        ← /admin/dashboard
└── users/
    ├── index.vue         ← /admin/users
    ├── add.vue           ← /admin/users/add
    └── [id].vue          ← /admin/users/:id
```

```typescript
// _middleware.ts
export default function (to, from, next) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn.value) return next({ name: "login" });
  next();
}

// _redirect.ts
export default "dashboard";
```

`ROUTER_NAME` được **auto-generate** riêng vào `views/vue-public/constants/router-name.ts` và `views/vue-admin/constants/router-name.ts` — **không chỉnh sửa thủ công**.

### Vue 3 Composition API (`<script setup lang="ts">`)

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "@fe-admin/composables/auth";

const { user, isLoggedIn } = useAuth();
const loading = ref(false);
</script>

<template>
  <div v-if="!loading">
    <!-- ... -->
  </div>
</template>

<style scoped lang="scss">
// SCSS với scoped styles — tuân theo RSCSS
</style>
```

### Pinia Store (Composition API style)

```typescript
import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useMyStore = defineStore("myStore", () => {
  const data = ref<DataType>({} as DataType);
  const isLoading = computed(() => ...);

  const fetchData = async () => { ... };

  return { data, isLoading, fetchData };
});
```

### Composable pattern

Composables trong `composables/` bọc Pinia stores với `storeToRefs`:

```typescript
import { storeToRefs } from "pinia";
import { useAuthStore } from "@fe-admin/stores/auth";

export const useAuth = () => {
  const authStore = useAuthStore();
  const { token, user, isLoggedIn } = storeToRefs(authStore);
  return {
    token,
    user,
    isLoggedIn,
    login: authStore.login,
    logout: authStore.logout,
    getProfile: authStore.getProfile,
  };
};
```

### Composables Overview

| Composable         | File              | Mục đích                    | Return                                                         |
| ------------------ | ----------------- | --------------------------- | -------------------------------------------------------------- |
| `useAuth`          | `auth.ts`         | Auth state + actions        | `{ token, user, isLoggedIn, login, logout, getProfile }`       |
| `useLoading`       | `loading.ts`      | Loading state               | `{ isLoading, showLoading, hiddenLoading }`                    |
| `useModal`         | `modal.ts`        | Single modal toggle         | `{ isOpenModal, openModal, closeModal, toggleModal }`          |
| `useMultipleModal` | `modal.ts`        | Nhiều modal                 | `{ modals, openModalName, closeModalName, closeAllModals }`    |
| `useConfirm`       | `confirm.ts`      | Confirm dialog (Promise)    | `{ openConfirm, isOpen, currentOptions, onConfirm, onCancel }` |
| `useNotification`  | `notification.ts` | Toast notification          | `{ notifySuccess, notifyError }`                               |
| `usePageInfo`      | `page.ts`         | Breadcrumb + page title     | `{ pageInfo, setPageInfo }`                                    |
| `useValidate`      | `validate.ts`     | Form validation (Vuelidate) | `{ v$, errors, setApiErrors, isApiErrors }`                    |
| `useAppRouter`     | `router.ts`       | Typed navigation            | `{ goToHome, goToLogin, goToDashboard, goToUsers, ... }`       |
| `useMedia`         | `media.ts`        | Image URL helper            | `{ getLinkImage }`                                             |

Ví dụ confirm dialog:

```typescript
const { openConfirm } = useConfirm();
const confirmed = await openConfirm({
  title: "Xóa người dùng",
  message: "Bạn có chắc chắn muốn xóa?",
  confirmText: "Xóa",
  cancelText: "Hủy",
});
if (!confirmed) return;
```

### Validation (Frontend)

Dùng composable `useValidate` với Vuelidate + `validate-rule.ts`:

```typescript
import { ref, computed } from "vue";
import { useValidate } from "@fe-admin/composables/validate";
import { requiredRule, emailRule } from "@fe-admin/helpers/validate-rule";

const form = ref({ username: "", email: "" });
const rules = computed(() => ({
  username: requiredRule("tên đăng nhập"),
  email: emailRule(),
}));
const { v$, errors } = useValidate(form, rules);

// Validate
const isValid = await v$.value.$validate(); // true/false

// Gán lỗi từ API response
const { setApiErrors } = useValidate(form, rules);
setApiErrors({ email: "users.emailAlreadyExists" }); // Tự map qua API_ERROR_MESSAGE
```

### API calls

API calls trong `apis/` dùng `ky` wrapper từ `@fe-admin/plugins/ky`. Wrapper tự động gắn `Authorization: Bearer <token>` header và parse JSON response:

```typescript
import { api } from "@fe-admin/plugins/ky";

export const list = () => api.get<User[]>("users");
export const getById = (id: string) => api.get<User>(`users/${id}`);
export const create = (form: UserForm) =>
  api.post<User>("users", { json: toPayload(form) });
export const update = (id: string, form: UserForm) =>
  api.put<User>(`users/${id}`, { json: toPayload(form, true) });
export const remove = (id: string) => api.delete(`users/${id}`);
```

API response type:

```typescript
type ResponseApi<T> = { status: string; message: string; result: T };
```

### API Error Mapping (Frontend)

Backend trả về error code (vd: `"users.emailAlreadyExists"`). Admin frontend map sang tiếng Việt qua `API_ERROR_MESSAGE` trong `views/vue-admin/constants/api-message.ts`:

```typescript
export const API_ERROR_MESSAGE: Record<string, string> = {
  "users.usernameAlreadyExists": "Tên đăng nhập đã tồn tại.",
  "users.emailAlreadyExists": "Email đã tồn tại.",
  "users.phoneAlreadyExists": "Số điện thoại đã tồn tại.",
  "users.cannotDeleteSelf": "Không thể xóa tài khoản đang đăng nhập.",
  "users.notFound": "Không tìm thấy người dùng.",
  "validation.error": "Dữ liệu không hợp lệ.",
};
```

**Quy tắc:** Khi thêm error code mới ở backend → phải thêm mapping tương ứng ở file này. `setApiErrors` trong `useValidate` tự động tra cứu mapping.

### FontAwesome Icons

Icon phải được khai báo tập trung theo từng app, ví dụ **`views/vue-admin/plugins/font-awesome.ts`** — không import rải rác ở component và không dùng chung registry giữa các app:

```typescript
// 1. Import icon
import { faHome, faUser } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";

// 2. Đăng ký vào library
library.add(faHome, faUser, faCircle);
```

```vue
<!-- 3. Dùng trong template (global component <fa-icon>) -->
<fa-icon icon="home" />
<fa-icon icon="circle" />
```

- Sắp xếp alphabet trong cả import và `library.add()`
- `<fa-icon>` đã được đăng ký global trong `main.ts`

### SCSS & CSS — RSCSS

Dự án tuân theo [RSCSS](https://ricostacruz.com/rscss/). Tất cả component Vue phải áp dụng trong block `<style scoped lang="scss">`.

#### Components — ≥ 2 từ, nối bằng `-`

| ✅ Đúng         | ❌ Sai    |
| --------------- | --------- |
| `.like-button`  | `.button` |
| `.search-form`  | `.search` |
| `.article-card` | `.card`   |

#### Elements — 1 từ, dùng `>` child selector

```scss
.search-form {
  > .field {
    /* ... */
  }
  > .action {
    /* ... */
  }
}
```

Nếu cần 2 từ, nối liền không dùng dấu gạch ngang: `.firstname`, `.lastname`.

#### Variants — tiền tố `-`

```scss
.like-button {
  &.-wide {
    /* ... */
  }
  &.-disabled {
    /* ... */
  }
}

.shopping-card {
  > .title {
    /* ... */
  }
  > .title.-small {
    /* ... */
  }
}
```

#### Layouts — tách positioning khỏi component

Không đặt `position`, `float`, `margin`, `width`, `height` trong component. Định nghĩa ở component cha:

```scss
// ✓ Đúng
.article-list {
  > .article-card {
    width: 33.3%;
    float: left;
  }
}

.article-card {
  > .image {
    /* ... */
  }
  > .title {
    /* ... */
  }
}
```

#### Helpers — tiền tố `_`, dùng hạn chế

```scss
._unmargin {
  margin: 0 !important;
}
._center {
  text-align: center !important;
}
```

#### Nesting — tối đa 1-2 cấp

```scss
// ✓ Tốt
.image-frame {
  > .description {
    /* ... */
  }
  > .description > .icon {
    /* ... */
  }
}
```

#### Quy tắc khác

- Không dùng ID selector, hạn chế tag selector
- SCSS global: `variables.scss`, `mixins.scss`, `colors.scss`, `common.scss` → forward qua `main.scss`
- `main.scss` tự động inject vào mọi component qua Vite config

---

## Database (Prisma)

- Schema: `prisma/schema.prisma`
- Migration: `bun run prisma:migrate` (dev) / `bun run prisma:migrate:production`
- Seed: `bun run prisma:seed`
- Reset: `bun run prisma:reset`
- Generate client: `bun run prisma:generate`
- UUID dùng `@default(uuid(7))`
- Tên bảng: snake_case với `@@map()`, cột có `@map()` cho `created_at`, `updated_at`

### Seed Data

Dữ liệu mẫu cho mỗi bảng đặt trong `prisma/tables/<table>.ts`. Dùng `upsert` để chạy được nhiều lần:

```typescript
// prisma/tables/users.ts
export const users = [{ username: "admin", password: "<hash>", ... }];

// prisma/seed.ts
for (const user of users) {
  await prisma.user.upsert({
    where: { username: user.username },
    update: { password: user.password, fullname: user.fullname, ... },
    create: user,
  });
}
```

- Mỗi bảng có file seed riêng trong `prisma/tables/`
- Luôn gọi `disconnectDatabase()` trong `finally`

---

## Build & Run Commands

```bash
# Development
bun run dev          # Chạy cả BE (nodemon) + FE (Vite watch)
bun run be           # Chỉ backend (port 5000)
bun run fe           # Chỉ frontend (port 3000)

# Build
bun run build        # Build cả FE + BE
bun run build:fe     # Build frontend (Vite → dist/frontend)
bun run build:be     # Build backend (Bun → dist/server.js)

# Production
bun run start        # Chạy production server (port từ PORT env)

# Prisma
bun run prisma:migrate              # Tạo và chạy migration (dev)
bun run prisma:migrate:production   # Deploy migration (production)
bun run prisma:generate             # Generate Prisma client
bun run prisma:seed                 # Seed data
bun run prisma:reset                # Reset database
```

---

## Các quy tắc chung

1. **Luôn dùng path alias** — không dùng relative import `../../`
2. **Validation với Zod** — mọi input từ client phải được validate
3. **Response chuẩn** — luôn dùng `createSuccessMessage` / `createErrorMessage`
4. **TypeScript strict** — `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
5. **Không dùng `any`** trừ khi thực sự cần thiết
6. **Error handling** — backend có `errorHandlerPlugin` xử lý global, không cần try-catch mọi nơi
7. **Environment variables** — dùng `process.env.*`, không hardcode secrets
8. **SCSS scoped + RSCSS** — luôn dùng `<style scoped lang="scss">` tuân theo RSCSS
9. **Composition API** — ưu tiên `<script setup>` với Composition API, không dùng Options API
10. **Bun** — mọi lệnh chạy bằng `bun`, không dùng `node`, `npm`, `npx` (trừ `bunx` thay cho `npx`)
11. **Function con dưới function chính** — khi route handler dài, tách function con đặt phía dưới
12. **Seed dùng upsert** — đảm bảo chạy lại được nhiều lần
13. **FontAwesome tập trung** — mọi icon khai báo trong `font-awesome.ts`
14. **SEO dùng `generateSeo`** — không viết thủ công thẻ meta trong Blade
