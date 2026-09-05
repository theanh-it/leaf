import { mkdir, rename } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

import { fileTypeFromBlob } from "file-type";

import { config } from "@be-config";
import { logger } from "@be-plugins/logger";

const IMAGE_ROOT = resolve(config.upload.root, config.upload.image.folder);
const ALLOWED_MIME_TYPES = new Set<string>(config.upload.image.mimeTypes);
const directoryPromises = new Map<string, Promise<void>>();

let activeUploads = 0;
const uploadQueue: Array<() => void> = [];

export type ImageUploadErrorCode =
  | "EMPTY_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "INVALID_FOLDER"
  | "TOO_MANY_IMAGES"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "WRITE_FAILED";

export type ImageUploadResult =
  | {
      success: true;
      message: "Image uploaded successfully";
      error: null;
      path: string;
      name: string;
      mimeType: string;
      size: number;
      originalName: string;
    }
  | {
      success: false;
      message: "Failed to upload image";
      error: ImageUploadErrorCode;
      path: null;
      name: null;
      mimeType: null;
      size: number;
      originalName: string;
    };

export interface UploadImageOptions {
  /** Thư mục con bên trong `files/images`. Không truyền dữ liệu trực tiếp từ client. */
  folder?: string;
  /** Chỉ có thể giảm giới hạn mặc định, không thể tăng. */
  maxFileSize?: number;
}

export interface UploadImagesOptions extends UploadImageOptions {
  /** Chỉ có thể giảm giới hạn mặc định, không thể tăng. */
  maxFiles?: number;
}

class ImageUploadError extends Error {
  constructor(readonly code: ImageUploadErrorCode) {
    super(code);
    this.name = "ImageUploadError";
  }
}

/**
 * Upload một ảnh với tên UUID v7 và phần mở rộng lấy từ magic bytes.
 * Ghi qua file tạm rồi rename để không bao giờ công khai file chưa hoàn chỉnh.
 */
export const uploadImage = async (
  file: File,
  options: UploadImageOptions = {}
): Promise<ImageUploadResult> => {
  try {
    return await withUploadSlot(() => persistImage(file, options));
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "WRITE_FAILED") {
      logger.error("Image upload failed", {
        error: getErrorMessage(error),
        fileName: file.name,
        fileSize: file.size,
      });
    }

    return createFailureResult(file, code);
  }
};

/**
 * Upload nhiều ảnh. Promise được tạo đồng thời nhưng semaphore dùng chung toàn
 * tiến trình chỉ cho phép một số lượng hữu hạn tác vụ đọc/ghi chạy cùng lúc.
 */
export const uploadImages = async (
  files: readonly File[],
  options: UploadImagesOptions = {}
): Promise<ImageUploadResult[]> => {
  const maxFiles = getEffectiveLimit(
    options.maxFiles,
    config.upload.image.maxFiles
  );

  if (files.length > maxFiles) {
    return files.map((file) => createFailureResult(file, "TOO_MANY_IMAGES"));
  }

  return Promise.all(files.map((file) => uploadImage(file, options)));
};

const persistImage = async (
  file: File,
  options: UploadImageOptions
): Promise<ImageUploadResult> => {
  validateImageSize(file, options.maxFileSize);

  const detectedType = await fileTypeFromBlob(file);
  if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType.mime)) {
    throw new ImageUploadError("UNSUPPORTED_IMAGE_TYPE");
  }

  const directory = resolveImageDirectory(options.folder);
  await ensureDirectory(directory);

  const name = `${Bun.randomUUIDv7()}.${detectedType.ext}`;
  const finalPath = resolve(directory, name);
  const temporaryPath = resolve(
    directory,
    `.${name}.${Bun.randomUUIDv7()}.tmp`
  );

  try {
    const bytesWritten = await Bun.write(temporaryPath, file);
    if (bytesWritten !== file.size) throw new Error("Incomplete image write");

    await rename(temporaryPath, finalPath);
  } catch (error) {
    await Bun.file(temporaryPath)
      .delete()
      .catch(() => undefined);
    throw new ImageUploadErrorWithCause("WRITE_FAILED", error);
  }

  return {
    success: true,
    message: "Image uploaded successfully",
    error: null,
    path: toPublicFilePath(finalPath),
    name,
    mimeType: detectedType.mime,
    size: file.size,
    originalName: file.name,
  };
};

const validateImageSize = (file: File, requestedLimit?: number): void => {
  if (file.size <= 0) throw new ImageUploadError("EMPTY_IMAGE");

  const maxFileSize = getEffectiveLimit(
    requestedLimit,
    config.upload.image.maxFileSize
  );

  if (file.size > maxFileSize) {
    throw new ImageUploadError("IMAGE_TOO_LARGE");
  }
};

const resolveImageDirectory = (folder = ""): string => {
  const directory = resolve(IMAGE_ROOT, folder);

  if (!isInsideRoot(IMAGE_ROOT, directory)) {
    throw new ImageUploadError("INVALID_FOLDER");
  }

  return directory;
};

const ensureDirectory = async (directory: string): Promise<void> => {
  const existingPromise = directoryPromises.get(directory);
  if (existingPromise) return existingPromise;

  const creationPromise = mkdir(directory, { recursive: true })
    .then(() => undefined)
    .catch((error: unknown) => {
      directoryPromises.delete(directory);
      throw error;
    });

  directoryPromises.set(directory, creationPromise);
  return creationPromise;
};

const withUploadSlot = async <T>(task: () => Promise<T>): Promise<T> => {
  await acquireUploadSlot();

  try {
    return await task();
  } finally {
    releaseUploadSlot();
  }
};

const acquireUploadSlot = async (): Promise<void> => {
  if (activeUploads < config.upload.image.concurrency) {
    activeUploads += 1;
    return;
  }

  await new Promise<void>((resolveQueue) => uploadQueue.push(resolveQueue));
};

const releaseUploadSlot = (): void => {
  const nextUpload = uploadQueue.shift();

  if (nextUpload) {
    nextUpload();
    return;
  }

  activeUploads -= 1;
};

const getEffectiveLimit = (
  requestedLimit: number | undefined,
  configuredLimit: number
): number => {
  if (
    requestedLimit === undefined ||
    !Number.isSafeInteger(requestedLimit) ||
    requestedLimit <= 0
  ) {
    return configuredLimit;
  }

  return Math.min(requestedLimit, configuredLimit);
};

const isInsideRoot = (root: string, target: string): boolean => {
  const pathFromRoot = relative(root, target);

  return (
    pathFromRoot === "" ||
    (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== "..")
  );
};

const toPublicFilePath = (absolutePath: string): string => {
  return relative(config.upload.root, absolutePath).split(sep).join("/");
};

const createFailureResult = (
  file: File,
  error: ImageUploadErrorCode
): ImageUploadResult => ({
  success: false,
  message: "Failed to upload image",
  error,
  path: null,
  name: null,
  mimeType: null,
  size: file.size,
  originalName: file.name,
});

const getErrorCode = (error: unknown): ImageUploadErrorCode => {
  return error instanceof ImageUploadError ? error.code : "WRITE_FAILED";
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ImageUploadErrorWithCause) {
    return error.cause instanceof Error
      ? error.cause.message
      : String(error.cause);
  }

  return error instanceof Error ? error.message : String(error);
};

class ImageUploadErrorWithCause extends ImageUploadError {
  constructor(
    code: ImageUploadErrorCode,
    readonly cause: unknown
  ) {
    super(code);
  }
}
