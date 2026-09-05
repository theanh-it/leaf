# Image upload helper

Tài liệu này hướng dẫn sử dụng `helpers/image.ts` để upload ảnh bằng Bun trong
Leaf. Helper phù hợp với ảnh có kích thước nhỏ và trung bình được gửi dưới dạng
`multipart/form-data`.

## Mục tiêu

Helper cung cấp hai API:

```typescript
import { uploadImage, uploadImages } from "@be-helpers/image";
```

- `uploadImage()` upload một ảnh.
- `uploadImages()` upload nhiều ảnh.
- Ghi file bất đồng bộ bằng `Bun.write()`.
- Giới hạn số tác vụ upload đồng thời trên toàn tiến trình.
- Kiểm tra định dạng thật bằng magic bytes, không tin vào MIME do client gửi.
- Dùng UUID v7 làm tên file.
- Ghi vào file tạm và chỉ rename khi đã ghi hoàn chỉnh.
- Chặn đường dẫn thoát khỏi `files/images`.

Helper không resize hoặc chuyển đổi ảnh ở backend. Đây là công việc CPU-bound;
nếu thực hiện trong request chính, nó có thể làm chậm các API khác. Frontend của
Leaf hiện có thể resize và chuyển WebP bằng `pica` trước khi upload.

## Cấu trúc lưu trữ

Mặc định ảnh được lưu như sau:

```text
files/
└── images/
    ├── 019c...a12.webp
    └── articles/
        └── 019c...b34.png
```

Giá trị `path` trả về luôn tương đối với thư mục `files`:

```text
images/019c...a12.webp
images/articles/019c...b34.png
```

## Cài đặt

Dependency kiểm tra magic bytes đã được khai báo trong `package.json`:

```bash
bun add file-type
```

Không cần chạy lại lệnh nếu dependency đã tồn tại.

## Cấu hình

Cấu hình nằm tại `config/index.ts`:

```typescript
upload: {
  root: process.env.UPLOAD_ROOT
    ? path.resolve(process.env.UPLOAD_ROOT)
    : path.join(process.cwd(), "files"),
  image: {
    folder: "images",
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 10,
    concurrency: 4,
    mimeTypes: [
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
  },
},
```

Có thể override bằng environment variables:

```env
UPLOAD_ROOT=./files
UPLOAD_IMAGE_MAX_FILE_SIZE=10485760
UPLOAD_IMAGE_MAX_FILES=10
UPLOAD_IMAGE_CONCURRENCY=4
```

`UPLOAD_IMAGE_MAX_FILE_SIZE` sử dụng byte. Một số giá trị thường dùng:

| Kích thước | Giá trị byte |
| ---------- | ------------ |
| 2 MB       | `2097152`    |
| 5 MB       | `5242880`    |
| 10 MB      | `10485760`   |

### Chọn concurrency

`UPLOAD_IMAGE_CONCURRENCY` là giới hạn tác vụ xác minh và ghi ảnh đồng thời trên
một tiến trình Leaf:

- `2`: ổ đĩa chậm hoặc máy ít tài nguyên.
- `4`: giá trị mặc định phù hợp với phần lớn ứng dụng.
- `8`: chỉ nên dùng sau khi benchmark trên SSD/NVMe.

Giới hạn này là process-local. Nếu chạy bốn worker, tổng số tác vụ có thể đạt
`4 × UPLOAD_IMAGE_CONCURRENCY`.

## Upload một ảnh

### API

```typescript
uploadImage(
  file: File,
  options?: {
    folder?: string;
    maxFileSize?: number;
  }
): Promise<ImageUploadResult>
```

Ví dụ:

```typescript
import { uploadImage } from "@be-helpers/image";

const result = await uploadImage(file, {
  folder: "avatars",
  maxFileSize: 5 * 1024 * 1024,
});
```

`folder` là thư mục con bên trong `files/images`. Đây phải là giá trị do server
quyết định, không truyền trực tiếp `body.folder` hoặc query của client vào helper.

`maxFileSize` chỉ có thể giảm giới hạn trong config. Truyền giá trị lớn hơn
`config.upload.image.maxFileSize` sẽ không làm tăng giới hạn.

### Kết quả thành công

```typescript
{
  success: true,
  message: "Image uploaded successfully",
  error: null,
  path: "images/avatars/019c...a12.webp",
  name: "019c...a12.webp",
  mimeType: "image/webp",
  size: 182340,
  originalName: "avatar.jpg"
}
```

Phần mở rộng và `mimeType` được lấy từ nội dung thật của file. Vì vậy một file
PNG có tên `photo.jpg` vẫn được lưu với phần mở rộng `.png`.

### Kết quả thất bại

```typescript
{
  success: false,
  message: "Failed to upload image",
  error: "UNSUPPORTED_IMAGE_TYPE",
  path: null,
  name: null,
  mimeType: null,
  size: 1200,
  originalName: "payload.jpg"
}
```

Helper không trả exception nội bộ cho client. Lỗi ghi file được ghi bằng logger
của backend.

## Upload nhiều ảnh

### API

```typescript
uploadImages(
  files: readonly File[],
  options?: {
    folder?: string;
    maxFileSize?: number;
    maxFiles?: number;
  }
): Promise<ImageUploadResult[]>
```

Ví dụ:

```typescript
import { uploadImages } from "@be-helpers/image";

const results = await uploadImages(files, {
  folder: "articles",
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 5,
});

const uploadedImages = results.filter((result) => result.success);
const failedImages = results.filter((result) => !result.success);
```

Nếu số file vượt `maxFiles`, helper không ghi file nào và tất cả kết quả nhận mã
`TOO_MANY_IMAGES`.

Nếu số lượng hợp lệ nhưng một file bị lỗi, những file hợp lệ khác vẫn có thể
được ghi thành công. `uploadImages()` không tự rollback toàn bộ batch.

## Ví dụ route Elysia: một ảnh

Ví dụ route `routes/api/images/post.ts`:

```typescript
import type { Context } from "elysia";
import { z } from "zod";

import { uploadImage } from "@be-helpers/image";
import { validateData } from "@be-helpers/request";
import { createErrorMessage, createSuccessMessage } from "@be-helpers/response";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const uploadImageSchema = z.object({
  image: z.file().max(MAX_IMAGE_SIZE),
});

type UploadImageBody = z.infer<typeof uploadImageSchema>;

export default async (context: Context) => {
  const validation = await validateData<UploadImageBody>(
    context.body as object,
    uploadImageSchema
  );

  if (validation.errors) {
    return context.status(
      422,
      createErrorMessage({
        message: "validation.error",
        result: validation.errors,
      })
    );
  }

  const result = await uploadImage(validation.output.image, {
    folder: "articles",
    maxFileSize: MAX_IMAGE_SIZE,
  });

  if (!result.success) {
    return context.status(
      getUploadErrorStatus(result.error),
      createErrorMessage({ message: `upload.${result.error}` })
    );
  }

  return context.status(
    201,
    createSuccessMessage({
      message: "upload.imageSuccess",
      result,
    })
  );
};

const getUploadErrorStatus = (error: string): 413 | 422 | 500 => {
  if (error === "IMAGE_TOO_LARGE") return 413;
  if (error === "WRITE_FAILED") return 500;

  return 422;
};
```

Magic bytes vẫn được helper kiểm tra sau validation. Không chỉ dựa vào
`File.type`, vì MIME này do client gửi và có thể bị giả mạo.

## Ví dụ route Elysia: nhiều ảnh

```typescript
import type { Context } from "elysia";
import { z } from "zod";

import { uploadImages } from "@be-helpers/image";
import { validateData } from "@be-helpers/request";
import { createErrorMessage, createSuccessMessage } from "@be-helpers/response";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

const imageSchema = z.file().max(MAX_IMAGE_SIZE);
const uploadImagesSchema = z.object({
  images: z
    .union([imageSchema, z.array(imageSchema)])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .refine((files) => files.length <= MAX_IMAGES, "Quá số lượng ảnh cho phép"),
});

type UploadImagesBody = z.infer<typeof uploadImagesSchema>;

export default async (context: Context) => {
  const validation = await validateData<UploadImagesBody>(
    context.body as object,
    uploadImagesSchema
  );

  if (validation.errors) {
    return context.status(
      422,
      createErrorMessage({
        message: "validation.error",
        result: validation.errors,
      })
    );
  }

  const results = await uploadImages(validation.output.images, {
    folder: "articles",
    maxFileSize: MAX_IMAGE_SIZE,
    maxFiles: MAX_IMAGES,
  });

  const hasFailure = results.some((result) => !result.success);
  if (hasFailure) {
    return context.status(
      422,
      createErrorMessage({
        message: "upload.someImagesFailed",
        result: results,
      })
    );
  }

  return context.status(
    201,
    createSuccessMessage({
      message: "upload.imagesSuccess",
      result: results,
    })
  );
};
```

Nếu route cần tính chất all-or-nothing, route phải xóa các file đã ghi khi một
item thất bại hoặc dùng một cơ chế transaction ở tầng service.

## Mã lỗi

| Mã lỗi                   | HTTP đề xuất | Ý nghĩa                                      |
| ------------------------ | ------------ | -------------------------------------------- |
| `EMPTY_IMAGE`            | 422          | File rỗng                                    |
| `IMAGE_TOO_LARGE`        | 413          | File vượt giới hạn                           |
| `INVALID_FOLDER`         | 500          | Folder do code server cung cấp không hợp lệ  |
| `TOO_MANY_IMAGES`        | 413 hoặc 422 | Batch vượt số lượng                          |
| `UNSUPPORTED_IMAGE_TYPE` | 422          | Magic bytes không thuộc loại ảnh được hỗ trợ |
| `WRITE_FAILED`           | 500          | Không thể ghi hoặc rename file               |

Nên thêm mapping tương ứng vào frontend, ví dụ
`views/vue-admin/constants/api-message.ts`:

```typescript
export const API_ERROR_MESSAGE: Record<string, string> = {
  "upload.EMPTY_IMAGE": "Ảnh không có dữ liệu.",
  "upload.IMAGE_TOO_LARGE": "Ảnh vượt dung lượng cho phép.",
  "upload.TOO_MANY_IMAGES": "Số lượng ảnh vượt giới hạn.",
  "upload.UNSUPPORTED_IMAGE_TYPE": "Định dạng ảnh không được hỗ trợ.",
  "upload.WRITE_FAILED": "Không thể lưu ảnh. Vui lòng thử lại.",
};
```

Không nên đưa `INVALID_FOLDER` ra giao diện người dùng vì đây thường là lỗi lập
trình hoặc cấu hình phía server.

## Gửi ảnh từ frontend

Một ảnh:

```typescript
const formData = new FormData();
formData.append("image", file);

await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
  method: "POST",
  body: formData,
});
```

Nhiều ảnh:

```typescript
const formData = new FormData();

for (const file of files) {
  formData.append("images", file);
}

await fetch(`${import.meta.env.VITE_API_URL}/api/images`, {
  method: "POST",
  body: formData,
});
```

Không tự đặt header `Content-Type`. Browser cần tự thêm multipart boundary.

## Phục vụ ảnh qua `/files/images`

Helper chỉ ghi file xuống đĩa. Để frontend truy cập ảnh, cần mount thư mục
`files` bằng `@elysiajs/static`.

Ví dụ thêm vào `config.static`:

```typescript
uploads: {
  assets: "files",
  prefix: "/files",
  alwaysStatic: false,
  noCache: !IS_PRODUCTION,
  maxAge: IS_PRODUCTION ? 86400 : 0,
  headers: {
    "X-Content-Type-Options": "nosniff",
  },
},
```

Sau đó đăng ký trong `server.ts`, sau các route hiện tại:

```typescript
app.use(await staticPlugin(config.static.uploads));
```

`alwaysStatic` phải là `false` cho thư mục có file mới được tạo trong lúc server
đang chạy. Nếu đặt `true`, plugin có thể chỉ đăng ký danh sách file tại thời điểm
khởi động.

URL đầy đủ có thể được tạo từ kết quả helper:

```typescript
const imageUrl = `${config.apiUrl}/files/${result.path}`;
```

Trong production có traffic lớn, nên để Nginx, CDN hoặc object storage phục vụ
ảnh thay vì truyền mọi lượt tải qua Elysia.

## RAM và multipart

`Bun.write()` là I/O bất đồng bộ, nhưng helper nhận một `File` sau khi Elysia đã
parse `multipart/form-data`. Vì vậy helper không biến toàn bộ request thành
network-to-disk streaming.

Giới hạn trong `uploadImage()` bảo vệ logic ghi file nhưng được kiểm tra sau bước
parse multipart. Cần giới hạn request ở tầng server hoặc reverse proxy để ngăn
request rất lớn chiếm RAM trước khi helper chạy.

Config hiện tại đang có:

```typescript
maxRequestBodySize: 100 * 1024 * 1024 * 1024, // 100 GB
```

Không nên giữ mức này cho API upload ảnh. Ví dụ nếu route cho phép tối đa năm
ảnh, mỗi ảnh 5 MB, có thể đặt giới hạn request khoảng 32 MB để chừa multipart
overhead:

```typescript
serve: {
  maxRequestBodySize: 32 * 1024 * 1024,
  idleTimeout: 30,
},
```

Nếu ứng dụng cần upload video hoặc file rất lớn, nên upload trực tiếp lên S3/R2
bằng presigned URL thay vì tăng giới hạn toàn server.

## Bảo mật

- Không tin `file.name` hoặc `file.type` từ client.
- Không dùng tên gốc làm tên file trên disk.
- Không đưa `folder` từ body/query trực tiếp vào helper.
- Không cho phép SVG nếu không có pipeline sanitize riêng.
- Luôn giới hạn dung lượng và số lượng ở cả server lẫn helper.
- Route upload phải có authentication, authorization và rate limit phù hợp.
- Không trả lỗi filesystem hoặc stack trace cho client.
- Khi lưu metadata vào database, lưu `result.path`, không lưu absolute path.

## Hiệu năng

Helper dùng các tối ưu sau:

1. `Bun.write()` ghi trực tiếp từ `File`, không tạo thêm `Response` hay buffer.
2. Magic-byte detection chỉ đọc phần dữ liệu cần thiết để nhận dạng định dạng.
3. Promise tạo thư mục được cache theo đường dẫn, không chạy `mkdir` cho mỗi file.
4. Semaphore giới hạn tác vụ đọc/ghi đồng thời trên toàn tiến trình.
5. File tạm và file cuối nằm cùng thư mục để `rename` có thể thực hiện nguyên tử.
6. `uploadImages()` không tạo bản sao dữ liệu ảnh; các task dùng lại `File` đã có.

Không nên resize ảnh trong handler chính. Nếu backend bắt buộc phải resize, nên
đưa tác vụ sang worker/job queue và chỉ trả response sau khi đã lưu file gốc hoặc
trả trạng thái xử lý bất đồng bộ.

## Kiểm thử

Chạy test riêng cho helper:

```bash
bun test helpers/image.test.ts
```

Test hiện kiểm tra:

- Extension lưu trữ được lấy từ magic bytes.
- Không còn file `.tmp` sau khi ghi thành công.
- Path traversal qua `folder` bị chặn.
- Giới hạn kích thước riêng của route hoạt động.
- Batch vượt giới hạn không được upload.

Chạy build backend:

```bash
bun run build:be
```

## Checklist tích hợp

- [ ] Route dùng Zod để validate field multipart.
- [ ] Route gọi `uploadImage()` hoặc `uploadImages()` từ `@be-helpers/image`.
- [ ] Folder là constant phía server.
- [ ] Route có auth và rate limit.
- [ ] `maxRequestBodySize` không còn để ở 100 GB.
- [ ] Thư mục `files` được mount ở `/files` hoặc phục vụ bởi CDN/Nginx.
- [ ] Error code đã được map ở frontend.
- [ ] Database chỉ lưu relative path.
- [ ] Đã chạy test và build backend.
