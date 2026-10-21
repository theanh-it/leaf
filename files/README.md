# Thư mục file upload

`files/` chứa file được tạo trong lúc ứng dụng chạy, ví dụ ảnh trong
`files/images/`. File upload không được commit vào Git. Khi triển khai, giữ thư mục
này trên ổ lưu trữ bền vững để không mất dữ liệu sau mỗi lần deploy.

Backend nhận upload qua API, validate rồi ghi file xuống đĩa. Với ảnh công khai ở
production, có thể cấu hình Nginx đọc trực tiếp thư mục này để giảm tải cho
Bun/Elysia và tránh phụ thuộc vào cache của static plugin.

## Cấu hình Nginx

Ví dụ project nằm ở `/var/www/leaf`, ảnh được lưu tại
`/var/www/leaf/files/images/`. Thêm các block sau vào `server` đang phục vụ domain
của ứng dụng; giữ cấu hình proxy API hiện có:

```nginx
location ^~ /files/images/ {
    alias /var/www/leaf/files/images/;

    autoindex off;
    sendfile on;

    expires 7d;
    add_header X-Content-Type-Options nosniff always;
}

# Chỉ công khai các thư mục đã khai báo cụ thể ở trên.
location /files/ {
    return 404;
}
```

- Thay đường dẫn `alias` bằng đường dẫn tuyệt đối trên server. Giữ dấu `/` cuối
  cả `location` và `alias`.
- Nginx cần quyền đọc file và quyền đi qua các thư mục cha; tiến trình Bun cần
  quyền ghi vào thư mục upload. Không cần cấp quyền `777`.
- Cấu hình `http` của Nginx cần nạp `mime.types` để trả đúng `Content-Type` cho ảnh.
- Nếu dùng Docker, mount cùng thư mục upload vào container backend và Nginx;
  đường dẫn `alias` là đường dẫn bên trong container Nginx. Nginx chỉ cần mount
  quyền đọc.

Khi đó URL `/files/images/example.webp` trả về file
`/var/www/leaf/files/images/example.webp`. File mới upload có thể truy cập ngay,
không cần restart ứng dụng hoặc reload Nginx. Cache 7 ngày phù hợp với ảnh có tên
UUID mới mỗi lần upload; nếu ghi đè nội dung cùng tên, cần điều chỉnh cache.

`helpers/image.ts` dùng `config.upload.root` (biến `UPLOAD_ROOT`, mặc định là
`files/` trong thư mục làm việc). Nếu đổi `UPLOAD_ROOT`, cập nhật `alias` tương ứng.
Helper cũ `helpers/file.ts` vẫn ghi vào `./files`.

Frontend đang tạo URL dạng `{VITE_API_URL}/files/images/<filename>`, vì vậy domain
trong `VITE_API_URL` cần đi qua Nginx có cấu hình trên. Backend hiện chỉ đăng ký
static cho `public/` và assets Vite, chưa đăng ký static cho `files/`.

## Phục vụ nhiều loại file: ảnh, video và PDF

Nginx có thể phục vụ cả ảnh, video và PDF. Ví dụ cấu hình phía trên chỉ mở
`/files/images/`; các URL khác dưới `/files/` sẽ trả `404`. Nếu cần công khai thêm
video và tài liệu PDF, thêm các block sau vào cùng `server`, bên cạnh block ảnh
và giữ nguyên block `location /files/` trả `404`:

```nginx
# Video công khai, ví dụ /files/videos/example.mp4.
location ^~ /files/videos/ {
    alias /var/www/leaf/files/videos/;

    autoindex off;
    sendfile on;
    add_header X-Content-Type-Options nosniff always;
}

# Tài liệu công khai, ví dụ /files/documents/example.pdf.
location ^~ /files/documents/ {
    alias /var/www/leaf/files/documents/;

    autoindex off;
    sendfile on;
    add_header X-Content-Type-Options nosniff always;
}
```

| URL                            | File trên server                            |
| ------------------------------ | ------------------------------------------- |
| `/files/images/example.webp`   | `/var/www/leaf/files/images/example.webp`   |
| `/files/videos/example.mp4`    | `/var/www/leaf/files/videos/example.mp4`    |
| `/files/documents/example.pdf` | `/var/www/leaf/files/documents/example.pdf` |

- Các thư mục `videos/` và `documents/` là ví dụ; tạo thư mục và cấu hình backend
  lưu file vào đúng nơi trước khi sử dụng.
- File `mime.types` được nạp trong `http` cần có ánh xạ `video/mp4` cho `.mp4`,
  `video/webm` cho `.webm` và `application/pdf` cho `.pdf`.
- Nginx hỗ trợ request `Range` để tải từng đoạn file, phục vụ tua video; không
  cấu hình `max_ranges 0` nếu cần chức năng này. Khả năng phát video còn phụ thuộc
  định dạng và codec mà trình duyệt hỗ trợ; Nginx không chuyển đổi codec.
- PDF có thể được mở bằng trình xem PDF của trình duyệt. Nếu muốn buộc tải xuống,
  thêm `add_header Content-Disposition attachment;` vào block tài liệu.
- `location` ở đây chỉ phân chia theo đường dẫn, không kiểm tra định dạng thực
  tế của file. Backend vẫn cần validate loại file và dung lượng trước khi lưu.
  `helpers/image.ts` chỉ chấp nhận ảnh; video và PDF cần API/validation phù hợp.
- Các block này chỉ phục vụ file đã lưu. Giới hạn upload vẫn được cấu hình riêng
  bằng `client_max_body_size` và validation của backend như bên dưới.

## Video HLS (`.m3u8`)

Nginx có thể phục vụ HLS bằng file static có sẵn. `.m3u8` là playlist tham chiếu
tới các đoạn video (segment), thường là `.ts` hoặc `.m4s`. Cần lưu đầy đủ playlist,
segment và các tài nguyên được tham chiếu khác, giữ đúng cấu trúc đường dẫn.
Chỉ upload một file `.m3u8` sẽ không đủ nếu các tài nguyên đó chưa truy cập được.

Ví dụ cấu trúc HLS dùng segment `.ts`:

```text
files/videos/hls/demo/
├── index.m3u8
├── segment000.ts
├── segment001.ts
└── segment002.ts
```

URL phát là `/files/videos/hls/demo/index.m3u8`. Nếu playlist ghi
`segment000.ts`, trình phát sẽ tải `/files/videos/hls/demo/segment000.ts`.
Với HLS dùng fragmented MP4, cần lưu cả file khởi tạo (ví dụ `init.mp4`) và các
segment `.m4s` được playlist tham chiếu.

Block `/files/videos/` phía trên đã ánh xạ được các file này. Kiểm tra `mime.types`
có MIME type phù hợp cho HLS. Nếu muốn cấu hình riêng, thêm block sau vào cùng
`server`; prefix dài hơn sẽ áp dụng cho `/files/videos/hls/`:

```nginx
location ^~ /files/videos/hls/ {
    alias /var/www/leaf/files/videos/hls/;

    autoindex off;
    sendfile on;

    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
        video/mp4 mp4 m4s;
    }
    default_type application/octet-stream;

    # Playlist livestream thay đổi liên tục: yêu cầu kiểm tra lại cache.
    # Ví dụ này áp dụng chính sách đó cho cả playlist và segment.
    expires off;
    add_header Cache-Control "no-cache" always;
    add_header X-Content-Type-Options nosniff always;

    # Nếu trình phát ở domain khác, bỏ comment và thay bằng origin frontend.
    # add_header Access-Control-Allow-Origin "https://app.example.com" always;
}
```

- Không đặt cache dài cho playlist livestream đang thay đổi. Segment có tên duy
  nhất và nội dung không đổi có thể dùng cache dài hơn khi tối ưu cấu hình riêng.
- Nếu frontend khác origin với domain phục vụ HLS, cần CORS cho tất cả tài nguyên
  được trình phát yêu cầu, gồm playlist, segment và file khởi tạo. Header CORS của
  Elysia không áp dụng cho các response do Nginx phục vụ trực tiếp.
- Frontend cần trình phát hỗ trợ HLS: dùng khả năng HLS có sẵn của trình duyệt
  hoặc thư viện như `hls.js` trên trình duyệt phù hợp. Khả năng phát vẫn phụ thuộc
  codec của video.
- Nginx trong ví dụ chỉ phục vụ bộ file đã tạo, không tự chuyển MP4 thành HLS.
  Cần bước xử lý bằng công cụ như FFmpeg hoặc dịch vụ mã hóa video để tạo playlist
  và segment; không cần module HLS riêng chỉ để phục vụ các file có sẵn.
- Backend có thể dùng `uploadVideoToHls()` từ `@be-helpers/video` để nhận video
  nguồn và tạo HLS VOD tại `files/videos/hls/<uuid>/`. Xem
  [hướng dẫn helper video](../helpers/video.md) về FFmpeg, cấu hình và kết quả.
  `helpers/image.ts` không nhận video hay playlist. Ví dụ Nginx này cũng không
  triển khai pipeline livestream hay các yêu cầu riêng của Low-Latency HLS.

## Giới hạn dung lượng upload

Cấu hình phục vụ file bằng `alias` độc lập với giới hạn request upload. Nginx mặc
định giới hạn body ở `1m` và trả lỗi `413` nếu vượt quá.

Ví dụ thêm dòng sau vào `location /api/` đang proxy về backend để cho phép tối đa
10 ảnh, mỗi ảnh 10 MiB, có chừa dung lượng multipart:

```nginx
client_max_body_size 110m;
```

Đây là giới hạn tổng request, không phải từng file. Helper `helpers/image.ts`
vẫn kiểm tra `UPLOAD_IMAGE_MAX_FILE_SIZE` (mặc định 10 MiB/ảnh) và
`UPLOAD_IMAGE_MAX_FILES` (mặc định 10 ảnh/lần). Cần đồng bộ với
`config.serve.maxRequestBodySize`; hiện backend đặt mức 100 GiB.

Điều chỉnh giới hạn theo từng endpoint nếu có upload video hoặc khôi phục backup
lớn. Chỉ thay `client_max_body_size` không thay đổi giới hạn validation của backend.

## Áp dụng cấu hình

Sau khi sửa cấu hình trên server:

```bash
sudo nginx -t
sudo nginx -s reload
```

Chỉ reload khi kiểm tra cấu hình thành công. Truy cập URL của một ảnh đã upload
để xác nhận ánh xạ đường dẫn và quyền đọc.

Chỉ phục vụ trực tiếp file công khai. File cần đăng nhập hoặc kiểm tra quyền phải
đi qua backend; không mount toàn bộ `files/` nếu có dữ liệu riêng tư.

Tham khảo: [Nginx alias](https://nginx.org/en/docs/http/ngx_http_core_module.html#alias),
[MIME types](https://nginx.org/en/docs/http/ngx_http_core_module.html#types),
[Range requests](https://nginx.org/en/docs/http/ngx_http_core_module.html#max_ranges)
và [client_max_body_size](https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size).
HLS: [triển khai HLS cơ bản](https://developer.apple.com/documentation/http-live-streaming/deploying-a-basic-http-live-streaming-hls-stream)
và [đặc tả HLS của Apple](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices/).
