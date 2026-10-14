export const API_ERROR_MESSAGE: Record<string, string> = {
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
} as const;
