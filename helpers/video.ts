import { mkdir, mkdtemp, readdir, rename, rm } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

import { fileTypeFromBlob } from "file-type";
import { z } from "zod";

import { config } from "@be-config";
import { validateData } from "@be-helpers/request";
import { logger } from "@be-plugins/logger";

const VIDEO_ROOT = resolve(config.upload.root, config.upload.video.folder);
const VIDEO_FORMATS: Readonly<Record<string, string>> = {
  "video/mp4": "mov",
  "video/matroska": "matroska",
  "video/quicktime": "mov",
  "video/webm": "matroska",
  "video/x-matroska": "matroska",
};

let activeConversions = 0;

export type VideoUploadErrorCode =
  | "EMPTY_VIDEO"
  | "VIDEO_TOO_LARGE"
  | "UNSUPPORTED_VIDEO_TYPE"
  | "UPLOAD_BUSY"
  | "FFMPEG_UNAVAILABLE"
  | "CONVERSION_FAILED"
  | "CONVERSION_TIMEOUT"
  | "WRITE_FAILED";

export type VideoUploadResult = {
  size: number;
  originalName: string;
} & (
  | {
      success: true;
      message: "Video converted to HLS successfully";
      error: null;
      /** Đường dẫn tương đối từ UPLOAD_ROOT, dùng sau prefix /files/. */
      path: string;
      directory: string;
      name: "index.m3u8";
      mimeType: "application/vnd.apple.mpegurl";
      sourceMimeType: string;
    }
  | {
      success: false;
      message: "Failed to convert video to HLS";
      error: VideoUploadErrorCode;
      path: null;
      directory: null;
      name: null;
      mimeType: null;
      sourceMimeType: null;
    }
);

export interface UploadVideoOptions {
  /** Chỉ giảm giới hạn mặc định. Không truyền option trực tiếp từ client. */
  maxFileSize?: number;
}

/**
 * Nhận video nguồn, tạo HLS VOD H.264/AAC tối đa 1280×720 rồi công khai bằng
 * atomic rename. File nguồn được xóa sau xử lý; không nhận playlist/URL từ client.
 */
export const uploadVideoToHls = async (
  file: File,
  options: UploadVideoOptions = {}
): Promise<VideoUploadResult> => {
  let hasSlot = false;

  try {
    const validatedFile = await validateVideo(file, options);

    if (activeConversions >= config.upload.video.concurrency) {
      throw new VideoUploadError("UPLOAD_BUSY");
    }
    activeConversions += 1;
    hasSlot = true;

    const detectedType = await fileTypeFromBlob(validatedFile).catch(
      () => undefined
    );
    const format = detectedType && VIDEO_FORMATS[detectedType.mime];
    if (!detectedType || !format) {
      throw new VideoUploadError("UNSUPPORTED_VIDEO_TYPE");
    }

    return await persistHls(validatedFile, format, detectedType.mime);
  } catch (error) {
    const code =
      error instanceof VideoUploadError ? error.code : "WRITE_FAILED";

    if (
      code === "WRITE_FAILED" ||
      code === "FFMPEG_UNAVAILABLE" ||
      code === "CONVERSION_FAILED" ||
      code === "CONVERSION_TIMEOUT"
    ) {
      logger.error("Video HLS upload failed", {
        code,
        fileName: file.name,
        fileSize: file.size,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      success: false,
      message: "Failed to convert video to HLS",
      error: code,
      path: null,
      directory: null,
      name: null,
      mimeType: null,
      sourceMimeType: null,
      size: file.size,
      originalName: file.name,
    };
  } finally {
    if (hasSlot) activeConversions -= 1;
  }
};

async function validateVideo(file: File, options: UploadVideoOptions) {
  const requestedLimit = options.maxFileSize;
  const maxFileSize =
    requestedLimit !== undefined &&
    Number.isSafeInteger(requestedLimit) &&
    requestedLimit > 0
      ? Math.min(requestedLimit, config.upload.video.maxFileSize)
      : config.upload.video.maxFileSize;
  const result = await validateData(file, z.file().min(1).max(maxFileSize));

  if (result.errors) {
    throw new VideoUploadError(
      file.size === 0 ? "EMPTY_VIDEO" : "VIDEO_TOO_LARGE"
    );
  }
  return result.output;
}

async function persistHls(file: File, format: string, sourceMimeType: string) {
  await mkdir(VIDEO_ROOT, { recursive: true });
  // Cùng filesystem với output để rename atomic, nhưng nằm ngoài videos/ public.
  const temporaryDirectory = await mkdtemp(
    join(config.upload.root, ".video-processing-")
  );

  try {
    const inputPath = join(temporaryDirectory, "input");
    const outputDirectory = join(temporaryDirectory, "hls");
    await mkdir(outputDirectory);

    const written = await Bun.write(inputPath, file);
    if (written !== file.size) throw new Error("Incomplete video write");

    await convertToHls(inputPath, outputDirectory, format);
    await validateHlsOutput(outputDirectory);

    const finalDirectory = join(VIDEO_ROOT, Bun.randomUUIDv7());
    await rename(outputDirectory, finalDirectory);
    const directory = relative(config.upload.root, finalDirectory)
      .split(sep)
      .join("/");

    return {
      success: true as const,
      message: "Video converted to HLS successfully" as const,
      error: null,
      path: `${directory}/index.m3u8`,
      directory,
      name: "index.m3u8" as const,
      mimeType: "application/vnd.apple.mpegurl" as const,
      sourceMimeType,
      size: file.size,
      originalName: file.name,
    };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true }).catch(
      (error: unknown) => {
        logger.error("Failed to clean video temporary directory", {
          directory: temporaryDirectory,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    );
  }
}

async function convertToHls(
  inputPath: string,
  outputDirectory: string,
  format: string
) {
  const { segmentDuration, threads, timeoutMs, ffmpegPath } =
    config.upload.video;
  let child;

  try {
    child = Bun.spawn(
      [
        ffmpegPath,
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostdin",
        "-y",
        "-protocol_whitelist",
        "file,pipe",
        "-f",
        format,
        "-threads",
        String(threads),
        "-i",
        inputPath,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-map_metadata",
        "-1",
        "-map_chapters",
        "-1",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-filter_threads",
        String(threads),
        "-threads",
        String(threads),
        "-force_key_frames",
        `expr:gte(t,n_forced*${segmentDuration})`,
        "-sc_threshold",
        "0",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
        "-f",
        "hls",
        "-hls_time",
        String(segmentDuration),
        "-hls_playlist_type",
        "vod",
        "-hls_list_size",
        "0",
        "-hls_flags",
        "independent_segments",
        "-hls_segment_filename",
        "segment%05d.ts",
        "index.m3u8",
      ],
      {
        cwd: outputDirectory,
        stdin: "ignore",
        stdout: "ignore",
        stderr: "pipe",
      }
    );
  } catch (error) {
    throw new VideoUploadError(
      "FFMPEG_UNAVAILABLE",
      error instanceof Error ? error.message : String(error)
    );
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);

  try {
    // Drain liên tục để pipe không bị đầy; chỉ giữ tối đa 8 KiB cho log lỗi.
    const [exitCode, stderr] = await Promise.all([
      child.exited,
      readErrorTail(child.stderr),
    ]);
    if (timedOut) throw new VideoUploadError("CONVERSION_TIMEOUT");
    if (exitCode !== 0) {
      throw new VideoUploadError("CONVERSION_FAILED", stderr);
    }
  } finally {
    clearTimeout(timer);
    // Không để FFmpeg chạy tiếp nếu việc đọc pipe hoặc chờ process gặp lỗi.
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await child.exited;
    }
  }
}

async function readErrorTail(stream: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  let tail = "";
  const reader = stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      tail = (tail + decoder.decode(value, { stream: true })).slice(-8192);
    }
  } finally {
    reader.releaseLock();
  }
  return (tail + decoder.decode()).slice(-8192);
}

async function validateHlsOutput(directory: string) {
  const playlist = Bun.file(join(directory, "index.m3u8"));
  if (!(await playlist.exists())) {
    throw new VideoUploadError("CONVERSION_FAILED", "Missing HLS playlist");
  }

  const content = await playlist.text();
  const segments = content
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"));
  const files = new Set(await readdir(directory));
  if (
    !content.startsWith("#EXTM3U") ||
    !content.includes("#EXT-X-ENDLIST") ||
    segments.length === 0
  ) {
    throw new VideoUploadError("CONVERSION_FAILED", "Incomplete HLS playlist");
  }
  for (const segment of segments) {
    if (
      !/^segment\d+\.ts$/.test(segment) ||
      !files.has(segment) ||
      Bun.file(join(directory, segment)).size === 0
    ) {
      throw new VideoUploadError("CONVERSION_FAILED", "Missing HLS segment");
    }
  }
}

class VideoUploadError extends Error {
  constructor(
    readonly code: VideoUploadErrorCode,
    detail?: string
  ) {
    super(detail || code);
    this.name = "VideoUploadError";
  }
}
