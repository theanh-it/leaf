import { z } from "zod";

export const usernameSchema = z.string().trim().min(3).max(255);

// bcrypt chỉ xử lý tối đa 72 byte; kiểm tra cả mật khẩu Unicode.
export const passwordSchema = z
  .string()
  .min(6)
  .max(255)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "users.passwordTooLong",
  });
