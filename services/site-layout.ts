import type { SiteLayout } from "@be-types/site-layout";

// Dữ liệu công khai bất biến, dùng tạm khi chưa có bảng cấu hình website.
const EMPTY_SITE_LAYOUT: SiteLayout = Object.freeze({
  header: Object.freeze({
    logo: null,
    links: Object.freeze([]),
  }),
  footer: Object.freeze({
    address: null,
    links: Object.freeze([]),
  }),
});

export function getSiteLayout(): SiteLayout {
  // Khi có schema: thêm query, cache và invalidation tại service này.
  return EMPTY_SITE_LAYOUT;
}
