# Integrations

Chứa code kết nối API và hệ thống bên ngoài Leaf, ví dụ cổng thanh toán,
dịch vụ email hoặc API thời tiết.

## Trách nhiệm

- Gửi request bằng Bun `fetch` hoặc HTTP client phù hợp.
- Quản lý xác thực, timeout và chuyển đổi lỗi của nhà cung cấp.
- Validate response bên ngoài bằng Zod trước khi chuyển dữ liệu cho service.
- Đọc URL và thông tin xác thực qua `@be-config`; khai báo biến môi trường
  trong `config/index.ts`, không hardcode secrets hoặc log token.
- Chỉ retry khi thao tác có thể thực hiện lại an toàn; không tự retry thao tác
  thanh toán hoặc ghi dữ liệu nếu chưa có cơ chế idempotency.

## Đặt tên và tổ chức

Đặt tên theo nhà cung cấp hoặc hệ thống thực tế. Kết nối nhỏ bắt đầu bằng một
file, ví dụ `integrations/weather.ts`. Khi lớn hơn, tách theo nhà cung cấp:

```text
integrations/
└── payment-provider/
    ├── client.ts       # HTTP client, xác thực, timeout
    ├── payments.ts     # Các thao tác với API thanh toán
    └── types.ts        # Kiểu dữ liệu của nhà cung cấp
```

Cây trên chỉ minh họa; thêm file khi có nhu cầu thật. Không tạo sẵn thư mục
cho nhà cung cấp chưa sử dụng.

## Luồng sử dụng

```text
Route / Provider → Service → Integration → API bên ngoài
```

Import qua alias root, ví dụ `@/integrations/weather`. Không dùng relative
import đi ngược thư mục.

Integration không phụ thuộc route, Elysia context hoặc Blade. Trả dữ liệu có
kiểu rõ ràng; service quyết định cache, kết hợp dữ liệu và xử lý nghiệp vụ.
Response HTTP của Leaf vẫn được tạo ở route bằng các helper response chuẩn.
