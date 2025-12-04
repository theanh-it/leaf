# 🏗️ Đề Xuất Monorepo Structure cho Leaf

## 📊 Phân Tích Hiện Tại

### Cấu Trúc Hiện Tại:
```
leaf/
├── engines/blade/     # Blade template engine (311 + 382 lines)
├── plugins/           # 5 plugins (blade, error-handler, logger, nnn-router, response-helper)
├── helpers/           # 2 helpers (blade-view, seo)
├── config/            # Configuration
├── types/              # Type definitions
├── routes/             # Application routes
└── views/              # Templates & Vue components
```

### Vấn Đề:
- ❌ Tất cả code trong 1 package → khó test riêng
- ❌ Khó tái sử dụng components ở project khác
- ❌ Khó versioning từng module
- ❌ Build/test toàn bộ mỗi khi thay đổi nhỏ

---

## ✅ Đề Xuất: Monorepo với Bun Workspaces

### Cấu Trúc Đề Xuất:

```
leaf/
├── packages/
│   ├── blade-engine/          # @leaf/blade-engine
│   │   ├── src/
│   │   │   ├── compiler.ts
│   │   │   ├── renderer.ts
│   │   │   └── simple-renderer.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tests/
│   │
│   ├── plugins/               # @leaf/plugins (hoặc tách riêng)
│   │   ├── blade/             # @leaf/plugin-blade
│   │   ├── error-handler/     # @leaf/plugin-error-handler
│   │   ├── logger/            # @leaf/plugin-logger
│   │   ├── nnn-router/        # @leaf/plugin-nnn-router
│   │   └── response-helper/    # @leaf/plugin-response-helper
│   │
│   ├── helpers/               # @leaf/helpers
│   │   ├── blade-view/        # @leaf/helper-blade-view
│   │   └── seo/               # @leaf/helper-seo
│   │
│   ├── core/                  # @leaf/core (main app)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   ├── routes/
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── types/                 # @leaf/types (shared types)
│       └── src/
│
├── apps/
│   └── web/                   # Main application
│       ├── package.json
│       └── src/
│
├── package.json               # Root workspace config
├── bun.lock
└── tsconfig.json              # Base tsconfig
```

---

## 🎯 Lợi Ích

### 1. **Dễ Test** ✅
```bash
# Test riêng từng package
bun test packages/blade-engine
bun test packages/plugins/blade
```

### 2. **Dễ Maintain** ✅
- Mỗi package có trách nhiệm rõ ràng
- Versioning độc lập
- Changelog riêng cho từng package

### 3. **Tái Sử Dụng** ✅
```typescript
// Có thể dùng Blade engine ở project khác
import { BladeEngine } from "@leaf/blade-engine";
```

### 4. **Build Tối Ưu** ✅
- Chỉ build packages thay đổi
- Cache dependencies tốt hơn
- Parallel builds

### 5. **Type Safety** ✅
- Shared types package
- Type checking across packages
- Better IDE support

---

## 📦 Packages Đề Xuất

### 1. **@leaf/blade-engine** (Core Engine)
**Mục đích:** Blade template engine độc lập

**Dependencies:**
- `ejs` (runtime)
- `html-minifier-terser` (optional)

**Exports:**
```typescript
export { BladeCompiler } from "./compiler";
export { BladeRenderer } from "./renderer";
export { SimpleRenderer } from "./simple-renderer";
```

**Tests:**
- Unit tests cho compiler
- Integration tests cho renderer
- Performance benchmarks

---

### 2. **@leaf/plugin-blade** (Elysia Plugin)
**Mục đích:** Elysia plugin wrapper cho Blade engine

**Dependencies:**
- `@leaf/blade-engine`
- `elysia`

**Exports:**
```typescript
export { bladePlugin } from "./plugin";
export type { BladeOptions } from "./types";
```

---

### 3. **@leaf/plugin-error-handler**
**Mục đích:** Global error handling plugin

**Dependencies:**
- `elysia`

---

### 4. **@leaf/plugin-nnn-router**
**Mục đích:** File-based routing plugin

**Dependencies:**
- `elysia`

---

### 5. **@leaf/helper-seo**
**Mục đích:** SEO helper functions

**Dependencies:**
- None (pure functions)

**Exports:**
```typescript
export { generateSEO } from "./seo";
export { generateWebSiteStructuredData } from "./structured-data";
```

---

### 6. **@leaf/helper-blade-view**
**Mục đích:** Blade view helper (giống Laravel view())

**Dependencies:**
- `@leaf/blade-engine`
- `@leaf/helper-seo`
- `elysia`

---

### 7. **@leaf/types** (Shared Types)
**Mục đích:** Shared TypeScript types

**Dependencies:**
- `elysia` (types only)

---

### 8. **@leaf/core** (Main App)
**Mục đích:** Main application

**Dependencies:**
- Tất cả packages trên

---

## 🛠️ Setup với Bun Workspaces

### 1. Root `package.json`:

```json
{
  "name": "leaf",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "bun run --filter @leaf/core dev",
    "build": "bun run --filter './packages/*' build",
    "test": "bun test",
    "test:blade": "bun test packages/blade-engine",
    "lint": "bun run --filter './packages/*' lint"
  }
}
```

### 2. Package `package.json` Example:

```json
{
  "name": "@leaf/blade-engine",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node",
    "test": "bun test",
    "dev": "bun --watch src/index.ts"
  },
  "dependencies": {
    "ejs": "^3.1.10"
  },
  "devDependencies": {
    "@types/ejs": "^3.1.5",
    "bun-types": "latest"
  }
}
```

---

## 📊 So Sánh: Monorepo vs Single Package

| Tiêu chí | Single Package | Monorepo |
|----------|---------------|----------|
| **Setup** | ✅ Đơn giản | ⚠️ Phức tạp hơn |
| **Testing** | ❌ Test toàn bộ | ✅ Test riêng từng package |
| **Reusability** | ❌ Khó tái sử dụng | ✅ Dễ tái sử dụng |
| **Versioning** | ❌ 1 version cho tất cả | ✅ Version riêng |
| **Build Time** | ❌ Build toàn bộ | ✅ Build incremental |
| **Type Safety** | ✅ OK | ✅ Tốt hơn (shared types) |
| **Maintainability** | ⚠️ Khó khi lớn | ✅ Dễ maintain |

---

## 🎯 Khuyến Nghị

### ✅ **NÊN TÁCH** nếu:
- ✅ Dự án sẽ lớn (>10k lines)
- ✅ Cần tái sử dụng components
- ✅ Cần test riêng từng module
- ✅ Có nhiều developers
- ✅ Cần publish packages riêng

### ❌ **CHƯA CẦN TÁCH** nếu:
- ❌ Dự án nhỏ (<5k lines)
- ❌ Chỉ 1-2 developers
- ❌ Không cần tái sử dụng
- ❌ Timeline gấp

---

## 🚀 Migration Plan (Nếu Quyết Định Tách)

### Phase 1: Setup Monorepo (1 ngày)
1. Tạo workspace structure
2. Move code vào packages
3. Setup build scripts
4. Test imports

### Phase 2: Tách Packages (2-3 ngày)
1. Tách `@leaf/blade-engine`
2. Tách plugins
3. Tách helpers
4. Update imports

### Phase 3: Testing & Docs (1-2 ngày)
1. Viết tests cho từng package
2. Update documentation
3. Setup CI/CD

**Tổng thời gian:** ~1 tuần

---

## 💡 Kết Luận

**Với dự án hiện tại:**
- ⚠️ **Chưa cần thiết** tách ngay (dự án còn nhỏ)
- ✅ **Nên chuẩn bị** structure để dễ tách sau
- ✅ **Nên tách** khi dự án lớn hơn (>10k lines) hoặc cần publish packages

**Khuyến nghị:** 
- Giữ structure hiện tại nhưng **tổ chức code tốt hơn**
- **Thêm tests** cho từng module
- **Chuẩn bị** để dễ tách sau khi cần

---

*Proposal created: 2024*

