# Đường dẫn test của Leaf

Mỗi file test phản chiếu **đúng đường dẫn file source chính**, thêm tiền tố `tests/` và đổi `.ts` thành `.test.ts`:

```text
helpers/image.ts                    → tests/helpers/image.test.ts
middlewares/required-admin.ts       → tests/middlewares/required-admin.test.ts
routes/api/auth/login/post.ts       → tests/routes/api/auth/login/post.test.ts
routes/api/auth/login/_middleware.ts → tests/routes/api/auth/login/_middleware.test.ts
routes/api/users/[id]/put.ts         → tests/routes/api/users/[id]/put.test.ts
server.ts                           → tests/server.test.ts
```

Tên thư mục, chữ hoa/thường, tên file HTTP method, `_middleware` và `[id]` được giữ nguyên. Test tích hợp có thể đi qua nhiều route/helper, nhưng được đặt theo source chính mà nó kiểm tra. Các assertion nằm trực tiếp trong file `.test.ts` đó.

## Bản đồ source → test

| Source                                    | File test                                            | Nội dung kiểm tra                                                              |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `backup/clear-backup.ts`                  | `tests/backup/clear-backup.test.ts`                  | Dọn backup hết hạn, giữ số bản tối thiểu, file tạm/symlink và cấu hình CLI     |
| `helpers/backup.ts`                       | `tests/helpers/backup.test.ts`                       | Liệt kê/sắp xếp backup, metadata tải xuống và chặn đường dẫn vượt thư mục      |
| `helpers/backup-operation.ts`             | `tests/helpers/backup-operation.test.ts`             | Khóa dùng chung giữa backup/restore và giữa server bundle/route nạp động       |
| `helpers/client-ip.ts`                    | `tests/helpers/client-ip.test.ts`                    | IP socket, proxy tin cậy, IPv4/IPv6 và header sai định dạng                    |
| `helpers/image.ts`                        | `tests/helpers/image.test.ts`                        | Nhận diện định dạng bằng nội dung, ghi ảnh và giới hạn upload                  |
| `helpers/request.ts`                      | `tests/helpers/request.test.ts`                      | Parse Zod, bỏ field thừa và lỗi input gốc                                      |
| `helpers/restore-backup.ts`               | `tests/helpers/restore-backup.test.ts`               | Khôi phục DB/files thật, rollback, archive cũ/hỏng và archive nguy hiểm        |
| `middlewares/required-admin.ts`           | `tests/middlewares/required-admin.test.ts`           | Quyền admin theo role và hạ quyền với JWT cũ                                   |
| `middlewares/required-login.ts`           | `tests/middlewares/required-login.test.ts`           | Tài khoản khóa/xóa và token sai/hết hạn                                        |
| `middlewares/restore-maintenance.ts`      | `tests/middlewares/restore-maintenance.test.ts`      | Chặn API khi restore và cho phép xem tiến trình                                |
| `routes/api/auth/login/post.ts`           | `tests/routes/api/auth/login/post.test.ts`           | Đăng nhập, validation, tài khoản bị khóa và ghi nhớ đăng nhập                  |
| `routes/api/auth/login/_middleware.ts`    | `tests/routes/api/auth/login/_middleware.test.ts`    | Giới hạn số lượt đăng nhập                                                     |
| `routes/api/auth/register/post.ts`        | `tests/routes/api/auth/register/post.test.ts`        | Đăng ký, hash mật khẩu, role/status mặc định và trùng username đồng thời       |
| `routes/api/auth/register/_middleware.ts` | `tests/routes/api/auth/register/_middleware.test.ts` | Giới hạn đăng ký, Retry-After và header IP giả                                 |
| `routes/api/auth/profile/get.ts`          | `tests/routes/api/auth/profile/get.test.ts`          | Profile hiện tại không chứa hash mật khẩu                                      |
| `routes/api/backups/restore/get.ts`       | `tests/routes/api/backups/restore/get.test.ts`       | Quyền xem trạng thái restore                                                   |
| `routes/api/backups/restore/post.ts`      | `tests/routes/api/backups/restore/post.test.ts`      | Validation upload và xung đột với thao tác backup                              |
| `routes/api/users/get.ts`                 | `tests/routes/api/users/get.test.ts`                 | Phân trang, tìm kiếm/lọc và validation query                                   |
| `routes/api/users/post.ts`                | `tests/routes/api/users/post.test.ts`                | Tạo user, dữ liệu công khai, email rỗng và trùng username                      |
| `routes/api/users/[id]/get.ts`            | `tests/routes/api/users/[id]/get.test.ts`            | Xem user, ẩn hash, UUID sai và user không tồn tại                              |
| `routes/api/users/[id]/put.ts`            | `tests/routes/api/users/[id]/put.test.ts`            | Cập nhật, hash mật khẩu mới, UUID sai và trùng email/phone                     |
| `routes/api/users/[id]/delete.ts`         | `tests/routes/api/users/[id]/delete.test.ts`         | Xóa user, chặn tự xóa và UUID sai                                              |
| `routes/health/ready/get.ts`              | `tests/routes/health/ready/get.test.ts`              | DB sẵn sàng, đang restore hoặc mất kết nối DB                                  |
| `server.ts`                               | `tests/server.test.ts`                               | Khởi chạy bundle production, auth, lỗi unique, phân quyền và ẩn SQL khi DB lỗi |

## Chạy test

Chạy tại thư mục root của Leaf:

```bash
bun run test               # Toàn bộ
bun run test:helpers       # tests/helpers/
bun run test:middlewares   # tests/middlewares/
bun run test:routes        # tests/routes/
bun run test:backup        # tests/backup/
bun run test:server        # tests/server.test.ts

# Một file cụ thể, giữ nguyên đường dẫn source
bun test tests/routes/api/auth/login/post.test.ts
bun test 'tests/routes/api/users/[id]/put.test.ts'
```

Đường dẫn có `[id]` cần đặt trong dấu nháy khi chạy qua shell để tránh bị hiểu thành glob.

Test API/database dùng PostgreSQL tạm riêng. Có thể cấu hình thư mục binaries qua `TEST_POSTGRES_BIN`. Nếu thiếu binaries thì các test cần DB được đánh dấu skip ở máy local; CI yêu cầu binaries. Khi chạy, terminal hiển thị cả tên file và từng bài test trong process con.

## Tiện ích riêng của test

`tests/support/` là thư mục chuẩn bị môi trường, không ánh xạ tới source ứng dụng:

- `postgres.ts`: tạo/dọn PostgreSQL tạm, kiểm tra không chạy nhầm DB dự án.
- `isolated-suite.ts`: chạy chính file test trong process dùng DB tạm.
- `api-context.ts`: app Elysia, user mẫu và hàm gửi request cho test API.
- `backup-api-context.ts`: app và user mẫu cho API restore/maintenance.

Hiện các bài test bao phủ backend. Chưa có test tự động cho component hoặc tương tác giao diện Vue.
