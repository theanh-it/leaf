export const API_ERROR_MESSAGE: Record<string, string> = {
  "http.notFound": "Không tìm thấy tài nguyên.",
  "request.parseError": "Định dạng yêu cầu không hợp lệ.",
  "server.error": "Máy chủ gặp lỗi. Vui lòng thử lại sau.",
  "health.unavailable": "Máy chủ chưa sẵn sàng phục vụ yêu cầu.",
  "auth.requiredToken": "Vui lòng đăng nhập.",
  "auth.invalidToken": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
  "auth.accountUnavailable":
    "Tài khoản chưa được kích hoạt hoặc không còn hoạt động.",
  "auth.forbidden": "Bạn không có quyền truy cập trang quản trị.",
  "login.failed": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "login.invalidCredentials": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "rateLimit.loginExceeded":
    "Bạn đăng nhập quá nhiều lần. Vui lòng thử lại sau một phút.",
  "rateLimit.registerExceeded":
    "Bạn đăng ký quá nhiều lần. Vui lòng thử lại sau một phút.",
  "users.passwordTooLong": "Mật khẩu không được vượt quá 72 byte UTF-8.",
  "backups.fileNotFound": "Không tìm thấy file backup.",
  "backups.invalidDatabase":
    "File database không hợp lệ. Hãy chọn bản backup .dump do ứng dụng tạo.",
  "backups.invalidArchive":
    "File backup files không hợp lệ, vượt giới hạn giải nén hoặc chứa đường dẫn/liên kết không được hỗ trợ.",
  "backups.restoreFileTooLarge":
    "File backup vượt giới hạn upload của máy chủ.",
  "backups.operationBusy":
    "Máy chủ đang backup hoặc khôi phục. Vui lòng chờ hoàn tất.",
  "backups.restoreConfiguration":
    "Cấu hình database hoặc thư mục files chưa phù hợp để khôi phục.",
  "backups.pgRestoreUnavailable":
    "Máy chủ chưa chạy được pg_restore. Kiểm tra PG_RESTORE_PATH.",
  "backups.restoreFailed":
    "Khôi phục không thành công. Hãy kiểm tra bản backup và phiên bản PostgreSQL; dữ liệu cũ đã được giữ lại nếu transaction bị lỗi.",
  "backups.restoreRollbackFailed":
    "Khôi phục lỗi và không thể hoàn lại files tự động. Cần quản trị máy chủ kiểm tra thư mục phục hồi trong log.",
  "backups.restoreMaintenance":
    "Hệ thống đang khôi phục dữ liệu. Vui lòng thử lại sau.",
  "shopCategory.slugExists": "Slug đã tồn tại.",
  "users.usernameAlreadyExists": "Tên đăng nhập đã tồn tại.",
  "users.emailAlreadyExists": "Email đã tồn tại.",
  "users.phoneAlreadyExists": "Số điện thoại đã tồn tại.",
  "users.cannotDeleteSelf": "Không thể xóa tài khoản đang đăng nhập.",
  "users.notFound": "Không tìm thấy người dùng.",
  "validation.error": "Dữ liệu không hợp lệ.",
  EMPTY_VIDEO: "File video không được để trống.",
  VIDEO_TOO_LARGE: "Video vượt giới hạn dung lượng cho phép.",
  UNSUPPORTED_VIDEO_TYPE: "Định dạng video không được hỗ trợ.",
  UPLOAD_BUSY: "Máy chủ đang xử lý video khác. Vui lòng thử lại sau.",
  FFMPEG_UNAVAILABLE: "Máy chủ chưa sẵn sàng chuyển đổi video.",
  CONVERSION_FAILED: "Không thể chuyển đổi video sang HLS.",
  CONVERSION_TIMEOUT: "Chuyển đổi video vượt thời gian cho phép.",
  WRITE_FAILED: "Không thể lưu file. Vui lòng thử lại.",
} as const;
