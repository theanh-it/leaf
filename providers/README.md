# Providers

Chứa cấu hình đăng ký dữ liệu hoặc hành vi dùng chung vào plugin của ứng dụng.
Hiện Leaf dùng provider dạng object/function, không có service container hoặc
cơ chế tự động quét thư mục.

## View provider hiện tại

`view.ts` export `viewProvider`, được import trực tiếp trong `server.ts` và
truyền vào `bladePlugin<LeafContext>()` cùng `config.blade`.

- `shared`: dữ liệu tĩnh dùng chung, hiện có `site` và `lang`.
- `resolveData`: gọi service để cung cấp dữ liệu khi render, hiện có `siteLayout`.

```text
server.ts → bladePlugin + viewProvider → Service → DB / Integration
```

Provider chỉ lắp ghép dữ liệu. Đặt query DB, HTTP client và cache nghiệp vụ trong
service/integration tương ứng. Import provider qua alias root, ví dụ
`@/providers/view`.

## Vòng đời và quy tắc dữ liệu

- `shared` được chuẩn bị khi tạo plugin. Object lồng nhau được giữ bằng tham
  chiếu và phải được xem là bất biến.
- `resolveData` chạy một lần cho mỗi lần render cấp ứng dụng, kể cả khi template
  đã có cache; package không cache kết quả provider.
- Layout và include kế thừa dữ liệu của lần render, không gọi lại provider.
- Lỗi provider được chuyển cho error handler của ứng dụng.
- Thứ tự ưu tiên: mặc định của package → `shared` → `resolveData` → dữ liệu trang.
  Merge nông; `undefined` không ghi đè giá trị trước đó.
- `vite`, `js`, `css` là khóa dành riêng, lấy từ context. Vite assets tiếp tục
  được quản lý bởi `middlewares/ssr.ts`.

Route tiếp tục dùng `bladeView(ctx, template, data)`; không cần tự truyền lại
dữ liệu dùng chung cho từng trang.

Provider này chỉ cấp dữ liệu cho Blade SSR, không tự đồng bộ sang Vue hoặc
Pinia. Nếu frontend cần cùng dữ liệu, ứng dụng phải chủ động truyền dữ liệu
ban đầu an toàn hoặc cung cấp API tương ứng.

Khi có thêm nhiều provider, thêm từng file theo chức năng; chỉ tạo `index.ts`
để tổng hợp khi cần.
