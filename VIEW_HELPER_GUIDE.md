# 🎯 View Helper Guide - Đơn Giản Như Laravel Blade

Leaf giờ đã có `view()` helper function giống Laravel, giúp render views đơn giản và dễ dàng hơn!

---

## ✅ Trước và Sau

### ❌ Trước (Phức tạp)

```typescript
import type { LeafContext } from "@be-types/leaf";
import { generateSEO, generateWebSiteStructuredData } from "@be-helpers/seo";
import { config } from "@be-config/index";

export default async (ctx: LeafContext) => {
  const vite = ctx.vite || { main: "", css: "" };
  const path = ctx.path || "/";

  // Generate SEO data
  const seo = generateSEO(
    {
      title: "Leaf App",
      description: "Description",
      image: config.seo.defaultImage,
      url: path,
      type: "website",
      siteName: config.seo.siteName,
      locale: config.seo.locale,
    },
    config.seo.baseUrl
  );

  // Generate structured data
  const structuredData = [
    generateWebSiteStructuredData(config.seo.baseUrl, config.seo.siteName),
  ];

  // Render với layout và SEO
  const html = await ctx.renderWithLayout("home.ejs", {
    seo,
    structuredData,
    vite,
    lang: "vi",
    twitterHandle: config.seo.twitterHandle,
    js: vite.main,
    css: vite.css,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
```

### ✅ Sau (Đơn giản như Laravel!)

```typescript
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return ctx.view("home.ejs", {
    title: "Leaf App",
    description: "Description",
  });
};
```

**Chỉ 3 dòng code!** 🎉

---

## 🚀 Cách Sử Dụng

### 1. Basic Usage (Giống Laravel)

```typescript
// routes/ssr/get.ts
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return ctx.view("home.ejs", {
    title: "Home Page",
    description: "Welcome to our website",
  });
};
```

**Tự động:**
- ✅ SEO meta tags
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Structured Data
- ✅ Vite assets (JS/CSS)
- ✅ Layout system

---

### 2. Với Data Nhiều Hơn

```typescript
export default async (ctx: LeafContext) => {
  const posts = await getPosts();
  
  return ctx.view("blog/index.ejs", {
    title: "Blog - All Posts",
    description: "Read our latest blog posts",
    posts: posts,
    currentPage: 1,
  });
};
```

---

### 3. Với SEO Tùy Chỉnh

```typescript
export default async (ctx: LeafContext) => {
  return ctx.view("article.ejs", {
    // Page data
    article: article,
    author: author,
    
    // SEO options
    title: article.title,
    description: article.excerpt,
    image: article.image,
    type: "article",
    noindex: false,
  });
};
```

---

### 4. Với Layout Khác

```typescript
export default async (ctx: LeafContext) => {
  return ctx.view("admin/dashboard.ejs", {
    layout: "admin", // Sử dụng admin.ejs layout
    title: "Admin Dashboard",
    users: users,
  });
};
```

---

### 5. Không SEO (JSON Response)

```typescript
export default async (ctx: LeafContext) => {
  const data = await getData();
  return ctx.status(200, data); // JSON response
};
```

---

## 📋 API Reference

### `ctx.view(template, data)`

Render view với SEO tự động.

**Parameters:**
- `template` (string): Template name (e.g., "home.ejs")
- `data` (object): Data to pass to template

**Data Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "Leaf App" | Page title |
| `description` | string | "Ứng dụng Leaf..." | Meta description |
| `image` | string | config.seo.defaultImage | OG image |
| `type` | string | "website" | OG type (website/article/product) |
| `noindex` | boolean | false | Block search engines |
| `layout` | string | "base" | Layout template name |
| `lang` | string | "vi" | HTML lang attribute |
| `...rest` | any | - | Other data for template |

**Returns:** `Promise<Response>`

---

## 🎨 Ví Dụ Thực Tế

### Example 1: Blog Post

```typescript
// routes/ssr/blog/[slug]/get.ts
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  const slug = ctx.params.slug;
  const post = await getPostBySlug(slug);

  if (!post) {
    return ctx.status(404, { error: "Post not found" });
  }

  return ctx.view("blog/post.ejs", {
    title: post.title,
    description: post.excerpt,
    image: post.image,
    type: "article",
    post: post,
    author: post.author,
  });
};
```

### Example 2: Product Page

```typescript
// routes/ssr/products/[id]/get.ts
export default async (ctx: LeafContext) => {
  const product = await getProduct(ctx.params.id);

  return ctx.view("products/show.ejs", {
    title: product.name,
    description: product.description,
    image: product.image,
    type: "product",
    product: product,
    relatedProducts: await getRelatedProducts(product.id),
  });
};
```

### Example 3: Admin Page

```typescript
// routes/ssr/admin/users/get.ts
export default async (ctx: LeafContext) => {
  const users = await getAllUsers();

  return ctx.view("admin/users/index.ejs", {
    layout: "admin", // Sử dụng admin layout
    title: "User Management",
    users: users,
  });
};
```

---

## 🔄 So Sánh với Laravel

| Laravel Blade | Leaf (EJS) |
|---------------|------------|
| `return view('home')` | `return ctx.view('home.ejs')` |
| `return view('home', ['title' => 'Home'])` | `return ctx.view('home.ejs', { title: 'Home' })` |
| `return view('admin.dashboard', compact('users'))` | `return ctx.view('admin/dashboard.ejs', { users })` |
| `return view('home')->with('title', 'Home')` | `return ctx.view('home.ejs', { title: 'Home' })` |

---

## ✨ Features Tự Động

Khi sử dụng `ctx.view()`, bạn tự động có:

1. **SEO Meta Tags**
   - Title, description
   - Open Graph
   - Twitter Cards
   - Canonical URL
   - Robots meta

2. **Structured Data**
   - JSON-LD WebSite
   - Có thể extend thêm Article, Product, etc.

3. **Assets**
   - Vite JS/CSS tự động inject
   - Favicon

4. **Layout System**
   - Tự động sử dụng layout "base"
   - Có thể custom layout

---

## 🎯 Best Practices

1. **Đơn giản nhất:**
   ```typescript
   return ctx.view("home.ejs", { title: "Home" });
   ```

2. **Với nhiều data:**
   ```typescript
   return ctx.view("blog/index.ejs", {
     title: "Blog",
     posts: posts,
     pagination: pagination,
   });
   ```

3. **Custom SEO:**
   ```typescript
   return ctx.view("article.ejs", {
     title: article.title,
     description: article.excerpt,
     image: article.image,
     type: "article",
   });
   ```

4. **Admin pages:**
   ```typescript
   return ctx.view("admin/dashboard.ejs", {
     layout: "admin",
     title: "Dashboard",
   });
   ```

---

## 🎉 Kết Luận

Giờ bạn có thể render views **đơn giản như Laravel** với chỉ một dòng code!

```typescript
return ctx.view("home.ejs", { title: "Home" });
```

**Tất cả SEO, assets, và layout đều tự động!** 🚀

