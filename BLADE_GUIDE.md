# 🌿 Blade Template Engine Guide

Blade-like template engine cho Leaf framework, tương tự Laravel Blade nhưng được tối ưu cho JavaScript/TypeScript.

---

## ✅ Tính Năng Hỗ Trợ

### 1. **Layout Inheritance** (`@extends` + `@section` + `@yield`)

```blade
{{-- layouts/app.blade.html --}}
<!DOCTYPE html>
<html>
<head>
    <title>@yield('title', 'Default Title')</title>
</head>
<body>
    @yield('content')
</body>
</html>

{{-- pages/home.blade.html --}}
@extends('layouts.app')

@section('title', 'Home Page')

@section('content')
    <h1>Welcome!</h1>
@endsection
```

### 2. **Include Partials** (`@include`)

```blade
{{-- Include simple --}}
@include('partials.header')

{{-- Include với data --}}
@include('partials.user-card', { user: user, showEmail: true })
```

### 3. **Conditionals** (`@if`, `@elseif`, `@else`, `@endif`)

```blade
@if(user)
    <p>Welcome, {{ user.name }}!</p>
@elseif(guest)
    <p>Please login</p>
@else
    <p>Hello guest</p>
@endif
```

### 4. **Loops** (`@foreach`, `@for`, `@while`)

```blade
{{-- Foreach --}}
@foreach(posts as post)
    <article>
        <h2>{{ post.title }}</h2>
    </article>
@endforeach

{{-- Foreach with key --}}
@foreach(items as key => item)
    <div>{{ key }}: {{ item }}</div>
@endforeach

{{-- For loop --}}
@for(i = 0; i < 10; i++)
    <span>Item {{ i }}</span>
@endfor
```

### 5. **Variables**

```blade
{{-- Escaped output (default) --}}
{{ user.name }}
{{ post.title }}

{{-- Raw output (HTML) --}}
{!! user.bio !!}
{!! post.content !!}
```

### 6. **Comments**

```blade
{{-- This is a comment, removed in production --}}
```

---

## 🚀 Cài Đặt & Sử Dụng

### 1. Cài Đặt Plugin

```typescript
// server.ts
import { bladePlugin } from "@be-plugins/blade";

app.use(
  bladePlugin({
    viewsDir: path.join(process.cwd(), "views/blade"),
    cache: true, // Enable cache
    minify: process.env.NODE_ENV === "production",
  })
);
```

### 2. Sử Dụng trong Routes

```typescript
// routes/home/get.ts
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return (ctx as any).blade.render("home", {
    title: "Home Page",
    features: [
      { title: "Fast", description: "Built with Bun" },
      { title: "Modern", description: "Vue 3 + TypeScript" },
    ],
  });
};
```

### 3. Sử Dụng Helper Function

```typescript
// routes/home/get.ts
import { bladeView } from "@be-helpers/blade-view";
import type { LeafContext } from "@be-types/leaf";

export default async (ctx: LeafContext) => {
  return bladeView(ctx, "home", {
    title: "Home Page",
    description: "Welcome to Leaf",
    features: [...]
  });
};
```

---

## 📁 Cấu Trúc Thư Mục

```
views/blade/
├── layouts/
│   ├── app.blade.html          # Main layout
│   └── admin.blade.html        # Admin layout
├── partials/
│   ├── header.blade.html
│   ├── footer.blade.html
│   └── nav.blade.html
├── components/
│   ├── button.blade.html
│   └── card.blade.html
└── pages/
    ├── home.blade.html
    └── about.blade.html
```

---

## 📝 Ví Dụ Chi Tiết

### Layout Template

```blade
{{-- views/blade/layouts/app.blade.html --}}
<!DOCTYPE html>
<html lang="{{ lang || 'vi' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Leaf App')</title>

    @if(css)
    <link rel="stylesheet" href="{{ css }}">
    @endif
</head>
<body>
    @include('partials.header')

    <main>
        @yield('content')
    </main>

    @include('partials.footer')

    @if(js)
    <script type="module" src="{{ js }}"></script>
    @endif
</body>
</html>
```

### Page Template

```blade
{{-- views/blade/home.blade.html --}}
@extends('layouts.app')

@section('title', 'Home - Leaf App')

@section('content')
<div id="app">
    <h1>Chào mừng đến với Leaf!</h1>

    @if(features && features.length > 0)
    <div class="features">
        @foreach(features as feature)
        <div class="feature-card">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
        </div>
        @endforeach
    </div>
    @endif
</div>
@endsection
```

### Partial Template

```blade
{{-- views/blade/partials/header.blade.html --}}
<header>
    <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
    </nav>
</header>
```

---

## 🔄 So Sánh với Laravel Blade

| Laravel Blade               | Leaf Blade                    | Ghi chú                    |
| --------------------------- | ----------------------------- | -------------------------- |
| `@extends('layout')`        | `@extends('layouts.app')`     | ✅ Giống nhau              |
| `@section('name')`          | `@section('name')`            | ✅ Giống nhau              |
| `@yield('name')`            | `@yield('name')`              | ✅ Giống nhau              |
| `@include('partial')`       | `@include('partials.header')` | ✅ Giống nhau              |
| `{{ $var }}`                | `{{ user.name }}`             | ⚠️ Bỏ `$` trong JavaScript |
| `{!! $html !!}`             | `{!! html !!}`                | ✅ Giống nhau              |
| `@if($condition)`           | `@if(condition)`              | ⚠️ Bỏ `$`                  |
| `@foreach($items as $item)` | `@foreach(items as item)`     | ⚠️ Bỏ `$`                  |

**Lưu ý**: Vì JavaScript không dùng `$` cho variables, nên syntax đã được điều chỉnh để phù hợp.

---

## ⚡ Best Practices

### 1. **Tổ Chức Templates**

- **Layouts**: `layouts/` - Page structure
- **Partials**: `partials/` - Reusable UI pieces
- **Components**: `components/` - UI components
- **Pages**: Root hoặc `pages/` - Page templates

### 2. **Naming Convention**

- Use `kebab-case` cho file names: `user-profile.blade.html`
- Use `camelCase` cho variables trong templates: `{{ userName }}`

### 3. **Performance**

- Enable cache trong production: `cache: true`
- Enable minification: `minify: true`
- Use partials để tránh duplicate code

### 4. **Security**

- Always use `{{ }}` for user input (escaped)
- Only use `{!! !!}` for trusted HTML content

---

## 🎯 Advanced Features

### Nested Sections

```blade
@extends('layouts.app')

@section('title', 'Page Title')

@section('content')
    <div class="container">
        @section('inner-content')
            <p>Default inner content</p>
        @endsection
    </div>
@endsection
```

### Conditional Includes

```blade
@if(user)
    @include('partials.user-menu', { user: user })
@else
    @include('partials.guest-menu')
@endif
```

### Loop Variables

```blade
@foreach(items as index => item)
    @if(index === 0)
        <div class="first">{{ item }}</div>
    @else
        <div>{{ item }}</div>
    @endif
@endforeach
```

---

## 🐛 Troubleshooting

### Template not found

```typescript
// Đảm bảo viewsDir đúng
bladePlugin({
  viewsDir: path.join(process.cwd(), "views/blade"),
});
```

### Section not rendering

```blade
{{-- Đảm bảo có @yield trong layout --}}
@yield('content')

{{-- Và @section trong page --}}
@section('content')
    Content here
@endsection
```

### Include not found

```blade
{{-- Sử dụng relative path từ viewsDir --}}
@include('partials.header')  ✅
@include('views/blade/partials/header')  ❌
```

---

## 🎉 Kết Luận

Blade template engine trong Leaf cung cấp:

- ✅ Syntax giống Laravel Blade
- ✅ Layout inheritance
- ✅ Partials & Components
- ✅ Conditionals & Loops
- ✅ Type-safe với TypeScript
- ✅ High performance với caching

**Tận hưởng sự linh hoạt của Blade trong Leaf!** 🚀
