# 🎨 SCSS Guide - Hướng Dẫn Sử Dụng SCSS

Leaf đã được cấu hình để hỗ trợ SCSS/SASS! Bạn có thể sử dụng tất cả tính năng của SCSS.

---

## ✅ Đã Cài Đặt

- ✅ `sass` package đã được cài đặt
- ✅ Vite đã được cấu hình để hỗ trợ SCSS
- ✅ Cấu trúc SCSS folder đã được tạo

---

## 📁 Cấu Trúc SCSS

```
views/vue/styles/
├── _variables.scss    # Variables (colors, typography, spacing, etc.)
├── _mixins.scss       # Reusable mixins
└── main.scss          # Main file (import all)
```

---

## 🚀 Cách Sử Dụng

### 1. Trong Vue Component

```vue
<script setup lang="ts"></script>

<template>
  <div class="my-component">
    <h1>Hello SCSS</h1>
  </div>
</template>

<style lang="scss" scoped>
// Variables và mixins đã được tự động inject!
// Không cần import nữa - sử dụng trực tiếp

.my-component {
  padding: $spacing-4;
  background: $white;
  border-radius: $radius-lg;

  h1 {
    color: $primary;
    font-size: $font-size-2xl;
  }

  @include mobile {
    padding: $spacing-2;
  }
}
</style>
```

### 2. Tự Động Inject (Không Cần Import!)

**Variables và mixins đã được tự động inject vào mọi SCSS file!**

Được cấu hình trong `vite.config.mts`:
```typescript
css: {
  preprocessorOptions: {
    scss: {
      additionalData: `
        @import "views/vue/styles/_variables.scss";
        @import "views/vue/styles/_mixins.scss";
      `,
    },
  },
}
```

**Bạn chỉ cần sử dụng trực tiếp, không cần import!** ✨

### 3. Sử Dụng Variables

```scss
.button {
  background-color: $primary;
  color: $white;
  padding: $spacing-3 $spacing-6;
  border-radius: $radius-md;
  font-size: $font-size-base;
}
```

### 4. Sử Dụng Mixins

```scss
.container {
  @include container;
}

.card {
  @include card;
}

.flex-center {
  @include flex-center;
}

.responsive-text {
  font-size: $font-size-base;

  @include responsive(lg) {
    font-size: $font-size-xl;
  }
}
```

---

## 📚 Variables Có Sẵn

### Colors

```scss
$primary, $secondary, $success, $warning, $error, $info
$white, $black
$gray-50 through $gray-900
```

### Typography

```scss
$font-family-sans, $font-family-mono
$font-size-xs through $font-size-4xl
$font-weight-normal, $font-weight-medium, $font-weight-semibold, $font-weight-bold
$line-height-tight, $line-height-normal, $line-height-relaxed
```

### Spacing

```scss
$spacing-1 through $spacing-20
```

### Breakpoints

```scss
$breakpoint-sm: 640px
$breakpoint-md: 768px
$breakpoint-lg: 1024px
$breakpoint-xl: 1280px
$breakpoint-2xl: 1536px
```

---

## 🔧 Mixins Có Sẵn

### Media Queries

```scss
@include mobile { }
@include tablet { }
@include desktop { }
@include responsive(lg) { }
```

### Flexbox

```scss
@include flex-center;
@include flex-between;
```

### Text Utilities

```scss
@include text-ellipsis;
@include text-ellipsis-multiline(3);
```

### Others

```scss
@include button-reset;
@include visually-hidden;
@include container;
@include card;
@include transition(color, 300ms);
```

---

## 💡 Ví Dụ

### Example 1: Card Component

```vue
<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>

<style lang="scss" scoped>
// Variables và mixins đã được tự động inject - không cần import!

.card {
  @include card;
  
  h3 {
    color: $gray-900;
    margin-bottom: $spacing-4;
  }

  p {
    color: $gray-600;
    line-height: $line-height-relaxed;
  }

  @include mobile {
    padding: $spacing-4;
  }
}
</style>
```

### Example 2: Button Component

```vue
<template>
  <button class="btn btn-primary">
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
// Không cần import - sử dụng trực tiếp!

.btn {
  @include button-reset;
  padding: $spacing-3 $spacing-6;
  border-radius: $radius-md;
  font-weight: $font-weight-medium;
  @include transition(all);

  &.btn-primary {
    background: $primary;
    color: $white;

    &:hover {
      background: darken($primary, 10%);
    }
  }
}
</style>
```

### Example 3: Responsive Layout

```scss
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-4;

  @include responsive(md) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(lg) {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
  }
}
```

---

## 🎯 Best Practices

1. **Không cần import variables và mixins nữa!**
   ```scss
   // ❌ Không cần nữa - đã được auto-inject
   // @import './styles/variables';
   // @import './styles/mixins';
   
   // ✅ Chỉ cần sử dụng trực tiếp
   .my-component {
     color: $primary;
     padding: $spacing-4;
   }
   ```

2. **Sử dụng variables thay vì hardcode:**
   ```scss
   // ❌ Bad
   color: #3b82f6;
   
   // ✅ Good
   color: $primary;
   ```

3. **Sử dụng mixins cho responsive:**
   ```scss
   // ❌ Bad
   @media (min-width: 1024px) { }
   
   // ✅ Good
   @include responsive(lg) { }
   ```

4. **Organize SCSS files:**
   ```
   components/
   ├── Button/
   │   ├── Button.vue
   │   └── Button.module.scss  (optional)
   ```

---

## 📖 SCSS Features

Bạn có thể sử dụng tất cả tính năng của SCSS:

- ✅ Variables
- ✅ Nesting
- ✅ Mixins
- ✅ Functions
- ✅ Partials (`_filename.scss`)
- ✅ Operators
- ✅ Parent Selector (`&`)

---

## 🎉 Kết Luận

Giờ bạn có thể viết SCSS đẹp và maintainable! 

**Hãy bắt đầu với:**
```scss
@import './styles/variables';
@import './styles/mixins';
```

và sử dụng các variables và mixins có sẵn! 🚀

