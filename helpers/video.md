# Upload video và chuyển sang HLS

`helpers/video.ts` cung cấp `uploadVideoToHls(file, options?)` để nhận một `File`
video nguồn và tạo HLS VOD. Helper dùng `Bun.spawn()` chạy FFmpeg, không chạy qua
shell và không cần thêm package JavaScript.

## Yêu cầu và cấu hình

Cài FFmpeg trên máy/container backend, có encoder `libx264` và `aac`:

```bash
ffmpeg -version
ffmpeg -encoders
```

Cấu hình tập trung tại `config.upload.video` trong `config/index.ts`. Các biến
môi trường có ví dụ trong `.env.example`:

| Biến                         | Mặc định    | Ý nghĩa                                             |
| ---------------------------- | ----------- | --------------------------------------------------- |
| `UPLOAD_ROOT`                | `./files`   | Thư mục upload, dùng chung với helper ảnh           |
| `FFMPEG_PATH`                | `ffmpeg`    | Executable trong PATH hoặc đường dẫn tuyệt đối      |
| `UPLOAD_VIDEO_MAX_FILE_SIZE` | `524288000` | Tối đa 500 MiB cho video nguồn                      |
| `UPLOAD_VIDEO_CONCURRENCY`   | `1`         | Số tác vụ xử lý đồng thời trong một instance helper |
| `UPLOAD_VIDEO_TIMEOUT_MS`    | `600000`    | Dừng FFmpeg sau 10 phút                             |
| `UPLOAD_VIDEO_THREADS`       | `2`         | Số thread cho decoder, filter và encoder            |
| `HLS_SEGMENT_DURATION`       | `6`         | Độ dài segment mục tiêu, tính bằng giây             |

Các giá trị số phải là số nguyên dương; giá trị không hợp lệ dùng mặc định.
Độ dài segment cuối có thể ngắn hơn độ dài mục tiêu.

## Sử dụng

```typescript
import { uploadVideoToHls } from "@be-helpers/video";

const result = await uploadVideoToHls(videoFile, {
  maxFileSize: 100 * 1024 * 1024,
});

if (result.success) {
  // Lưu result.path vào database; ghép với domain phục vụ file khi hiển thị.
  const playlistUrl = `/files/${result.path}`;
}
```

`maxFileSize` là tùy chọn và chỉ giảm giới hạn đã cấu hình, không tăng giới hạn
server. Không lấy options hoặc đường dẫn output trực tiếp từ client.

Helper kiểm tra dung lượng bằng Zod qua `validateData()`, nhận diện container từ
nội dung file và chấp nhận MP4, MOV, WebM, MKV. Tên file và MIME type do client
khai báo không quyết định định dạng đầu vào. FFmpeg giải mã và mã hóa lại video;
file hỏng hoặc thiếu stream video bị từ chối nếu không chuyển đổi được.

Output có một mức chất lượng: H.264, pixel format `yuv420p`, tối đa 1280×720,
giữ tỉ lệ khung hình, không phóng to video nhỏ và chuẩn hóa kích thước thành số
chẵn. Audio đầu tiên được chuyển thành AAC stereo 128 kbit/s; video không có
audio vẫn được chấp nhận. Đây là HLS VOD, không phải livestream hoặc nhiều mức
bitrate adaptive.

```text
files/videos/hls/<uuid>/
├── index.m3u8
├── segment00000.ts
├── segment00001.ts
└── ...
```

Kết quả thành công:

```typescript
{
  success: true,
  message: "Video converted to HLS successfully",
  error: null,
  path: "videos/hls/<uuid>/index.m3u8",
  directory: "videos/hls/<uuid>",
  name: "index.m3u8",
  mimeType: "application/vnd.apple.mpegurl",
  sourceMimeType: "video/mp4",
  size: 123456, // Dung lượng video nguồn, không phải tổng dung lượng HLS.
  originalName: "video.mp4",
}
```

File nguồn và output đang xử lý nằm trong thư mục tạm bên dưới `UPLOAD_ROOT`,
ngoài thư mục `videos/` công khai. Helper chỉ rename output sang thư mục UUID sau
khi FFmpeg thành công và playlist/segment được kiểm tra. File nguồn được xóa sau
xử lý; helper không lưu bản gốc lâu dài. Thư mục tạm được dọn trong `finally`, lỗi
dọn dẹp được ghi log. Nếu process bị kill/crash, có thể còn thư mục
`.video-processing-*`; chỉ dọn khi chắc chắn không có tác vụ đang sử dụng.

Khi xóa một video, cần xóa cả thư mục `result.directory`, không chỉ playlist.
Đường dẫn dùng để xóa phải lấy từ dữ liệu tin cậy và được kiểm tra nằm trong
upload root.

## Lỗi

Kết quả lỗi có `success: false`, `error` là một trong các mã dưới đây; `path`,
`directory`, `name`, `mimeType` và `sourceMimeType` là `null`.

| Mã                       | Ý nghĩa                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `EMPTY_VIDEO`            | File rỗng                                                          |
| `VIDEO_TOO_LARGE`        | Vượt giới hạn dung lượng                                           |
| `UNSUPPORTED_VIDEO_TYPE` | Container không hỗ trợ, playlist hoặc dữ liệu không nhận diện được |
| `UPLOAD_BUSY`            | Đã đủ số tác vụ đồng thời, không xếp hàng thêm                     |
| `FFMPEG_UNAVAILABLE`     | Không khởi chạy được FFmpeg                                        |
| `CONVERSION_FAILED`      | FFmpeg báo lỗi hoặc bộ HLS chưa đầy đủ                             |
| `CONVERSION_TIMEOUT`     | FFmpeg vượt thời gian cho phép và bị dừng                          |
| `WRITE_FAILED`           | Không ghi/di chuyển được file hoặc lỗi I/O khác                    |

Helper trả kết quả nội bộ, không tự tạo HTTP response. Route gọi helper vẫn cần
validate body bằng `validateData()`, kiểm tra quyền/rate limit và trả response qua
`createSuccessMessage()` / `createErrorMessage()`. Các mã lỗi trên đã có mapping
tiếng Việt trong `views/vue-admin/constants/api-message.ts` khi route trả chúng
về frontend.

## Vận hành

- `await uploadVideoToHls()` chỉ hoàn tất sau khi chuyển đổi xong. Với video lớn,
  nên chạy trong background job và trả job ID từ API để tránh timeout HTTP; helper
  này không triển khai job queue hoặc endpoint upload.
- Giới hạn đồng thời chỉ áp dụng trong instance module hiện tại. Nếu nhiều
  process/replica, cần queue hoặc giới hạn chung để kiểm soát tài nguyên toàn hệ
  thống. Trường hợp `UPLOAD_BUSY`, caller có thể thử lại sau.
- Helper nhận `File` sau khi Elysia parse multipart. Cần giới hạn request ở
  Nginx/Bun; mặc định `110m` trong README chỉ là ví dụ upload ảnh, không đủ cho
  video 500 MiB. Chọn giới hạn có chừa multipart overhead và chừa dung lượng đĩa
  cho cả input tạm lẫn output HLS (có thể lớn hơn input).
- Dùng cấu hình HLS trong [files/README.md](../files/README.md) để Nginx phục vụ
  `/files/videos/hls/`. Nginx cần đọc được output; không public thư mục tạm.

Kiểm tra helper:

```bash
bun test tests/helpers/video.test.ts
```

Test tích hợp sinh video mẫu và kiểm tra output bằng FFmpeg/ffprobe. Nếu thiếu
binary thì nhóm tích hợp được skip; nhóm validation và mô phỏng timeout vẫn chạy.

Tham khảo: [FFmpeg HLS muxer](https://ffmpeg.org/ffmpeg-formats.html#hls-2).
