# 📄 Hướng Dẫn Sử Dụng EJS Layout System (Giống Blade)

EJS plugin đã được cấu hình để hỗ trợ layout system và include giống Blade của Laravel.

---

## ✅ Tính Năng Đã Hỗ Trợ

### 1. **Include Partials** (Giống `@include`)

```ejs
<!-- Include từ partials folder -->
<%- include('partials/header') %>

<!-- Include với data -->
<%- include('partials/header', { title: 'Page Title' }) %>

<!-- Include từ thư mục khác -->
<%- include('/components/button') %>
```

### 2. **Layout System** (Giống `@extends` + `@section`)

```typescript
// routes/ssr/page/get.ts
await ctx.renderWithLayout("page.ejs", {
  seo,
  structuredData,
  // ... data
});
```

### 3. **Tự Động Tìm File**

Plugin tự động tìm file trong:
- Cùng thư mục với template hiện tại
- Root `views/ejs/`
- `views/ejs/partials/`

---

## 🚀 Cách Sử Dụng

### 1. Include Partials

#### Tạo Partial

```ejs
<!-- views/ejs/partials/header.ejs -->
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
```

#### Sử Dụng trong Template

```ejs
<!-- views/ejs/page.ejs -->
<%- include('partials/header') %>

<div class="content">
  <h1><%= title %></h1>
</div>

<%- include('partials/footer') %>
```

#### Include với Data

```ejs
<!-- Include với custom data -->
<%- include('partials/header', { 
  currentPage: 'home',
  user: userData 
}) %>
```

---

### 2. Layout System

#### Layout Template (base.ejs)

```ejs
<!DOCTYPE html>
<html lang="<%= lang || 'vi' %>">
<head>
  <title><%= seo.title %></title>
  <!-- ... SEO meta tags ... -->
</head>
<body>
  <%- typeof include !== 'undefined' ? include('partials/header') : '' %>
  
  <main>
    <%- body %>
  </main>
  
  <%- typeof include !== 'undefined' ? include('partials/footer') : '' %>
</body>
</html>
```

#### Page Template

```ejs
<!-- views/ejs/home.ejs -->
<div id="app">
  <h1>Welcome to Leaf!</h1>
  <p>Content here...</p>
</div>
```

#### Sử Dụng trong Route

```typescript
// routes/ssr/get.ts
const html = await ctx.renderWithLayout("home.ejs", {
  seo,
  structuredData,
  lang: "vi",
  js: vite.main,
  css: vite.css,
});
```

---

### 3. Nested Partials

```ejs
<!-- views/ejs/partials/nav.ejs -->
<nav>
  <%- include('nav-item', { href: '/', label: 'Home' }) %>
  <%- include('nav-item', { href: '/about', label: 'About' }) %>
</nav>
```

---

### 4. Conditional Include

```ejs
<% if (user) { %>
  <%- include('partials/user-menu', { user: user }) %>
<% } else { %>
  <%- include('partials/login-button') %>
<% } %>
```

---

## 📁 Cấu Trúc Thư Mục Đề Xuất

```
views/ejs/
├── base.ejs           # Main layout
├── layouts/           # Additional layouts
│   ├── admin.ejs
│   └── guest.ejs
├── partials/          # Reusable components
│   ├── header.ejs
│   ├── footer.ejs
│   ├── nav.ejs
│   └── sidebar.ejs
├── components/        # UI components
│   ├── button.ejs
│   ├── card.ejs
│   └── modal.ejs
└── pages/             # Page templates
    ├── home.ejs
    ├── about.ejs
    └── contact.ejs
```

---

## 🔧 Ví Dụ Thực Tế

### Example 1: Layout với Partials

```ejs
<!-- views/ejs/base.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= seo.title %></title>
  <%- typeof include !== 'undefined' ? include('partials/head-extra') : '' %>
</head>
<body>
  <%- typeof include !== 'undefined' ? include('partials/header') : '' %>
  
  <main>
    <%- body %>
  </main>
  
  <%- typeof include !== 'undefined' ? include('partials/footer') : '' %>
</body>
</html>
```

```ejs
<!-- views/ejs/pages/about.ejs -->
<div>
  <h1>About Us</h1>
  <p>Content...</p>
  
  <%- include('components/team-section') %>
</div>
```

### Example 2: Dynamic Include

```ejs
<!-- views/ejs/blog/post.ejs -->
<article>
  <header>
    <%- include('partials/post-header', { post: post }) %>
  </header>
  
  <div class="content">
    <%= post.content %>
  </div>
  
  <% if (post.comments.length > 0) { %>
    <%- include('components/comment-list', { comments: post.comments }) %>
  <% } %>
</article>
```

---

## 📝 So Sánh với Blade

| Blade | EJS (Leaf) |
|-------|------------|
| `@extends('layout')` | `renderWithLayout('template', data, 'layout')` |
| `@section('content')` | `body` variable trong layout |
| `@yield('title')` | `<%- title %>` hoặc data variables |
| `@include('partial')` | `<%- include('partial') %>` |
| `@component('button')` | `<%- include('components/button') %>` |

---

## ⚡ Best Practices

1. **Tổ chức Partials:**
   - `partials/` - Reusable UI pieces (header, footer, nav)
   - `components/` - UI components (button, card, modal)
   - `layouts/` - Page layouts

2. **Naming Convention:**
   - Partials: `kebab-case.ejs` (header-nav.ejs)
   - Components: `kebab-case.ejs` (button-primary.ejs)
   - Layouts: `kebab-case.ejs` (admin-layout.ejs)

3. **Include Paths:**
   - Relative: `include('partials/header')`
   - Absolute: `include('/components/button')`
   - Tự động tìm trong partials folder

4. **Data Passing:**
   - Pass data khi include: `include('partial', { data })`
   - Global data được share tự động

---

## 🎯 Kết Luận

EJS trong Leaf giờ đã hỗ trợ:
- ✅ Include partials giống Blade
- ✅ Layout system với `renderWithLayout()`
- ✅ Tự động tìm file trong nhiều locations
- ✅ Share data giữa templates

**Tuy không có syntax `@extends` như Blade, nhưng `renderWithLayout()` đạt được mục đích tương tự và linh hoạt hơn!**

