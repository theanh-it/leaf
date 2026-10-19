# Services

Chứa logic nghiệp vụ backend có thể được route, provider hoặc tác vụ nền sử dụng.

## Trách nhiệm

- Query DB bằng Prisma hoặc gọi API ngoài qua `@/integrations/*`.
- Kết hợp dữ liệu và chuyển thành cấu trúc phục vụ nghiệp vụ của Leaf.
- Quản lý cache dữ liệu khi cần, bao gồm thời điểm làm mới và invalidation.
- Giữ dữ liệu riêng của người dùng trong phạm vi request; không cache chung
  context, token hoặc thông tin cá nhân giữa các request.

Service không trực tiếp render Blade hoặc tạo response HTTP. Route chịu trách
nhiệm validate input và trả response; provider đưa kết quả service vào SSR.

## Đặt tên và tổ chức

Đặt tên theo nghiệp vụ, dùng kebab-case, ví dụ `site-layout.ts` hoặc `payment.ts`.
Import qua `@be-services/*`. Kiểu nghiệp vụ dùng chung đặt trong `types/` và
import qua `@be-types/*`.

Giữ query và cache cùng file khi logic còn nhỏ. Khi một nghiệp vụ lớn lên,
có thể chuyển thành thư mục với các file riêng cho query, cache và xử lý nghiệp vụ.
Không cần thêm repository hoặc cache abstraction trước khi có nhu cầu.

## Service hiện tại

`site-layout.ts` cung cấp `getSiteLayout()` cho dữ liệu header/footer. Hiện
service trả object rỗng bất biến vì chưa có bảng cấu hình website trong DB;
chưa có query, TTL hoặc cơ chế invalidation.

Khi triển khai DB/cache cho service này:

- Chỉ lấy dữ liệu công khai cần cho giao diện.
- Gộp các lần tải đồng thời khi cache trống bằng single-flight.
- Vô hiệu hóa cache sau khi transaction cập nhật DB đã commit.
- Ngăn query đang chạy đưa dữ liệu cũ trở lại cache sau invalidation.
- Có TTL dự phòng và khóa cache theo ngôn ngữ/tenant nếu dữ liệu khác nhau.
- Xem dữ liệu cache là bất biến; không sửa object lồng nhau khi render.
- Nếu chạy nhiều process/server, cần cơ chế đồng bộ invalidation hoặc cache chung.
