import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type { VideoUploadResult } from "@be-helpers/video";

const TEST_ROOT = await mkdtemp(join(tmpdir(), "leaf-video-test-"));
const FFMPEG = Bun.which(process.env.FFMPEG_PATH || "ffmpeg");
const FFPROBE = Bun.which("ffprobe");
const MP4 = join(TEST_ROOT, "source.mp4");
const SILENT = join(TEST_ROOT, "silent.mkv");
const VIDEO_TESTS = FFMPEG && FFPROBE ? describe : describe.skip;

beforeAll(async () => {
  await Bun.write(join(TEST_ROOT, "empty"), "");
  await Bun.write(
    join(TEST_ROOT, "playlist.m3u8"),
    "#EXTM3U\nhttps://example.com/a.ts\n"
  );
  // Magic bytes MP4 hợp lệ nhưng nội dung container hỏng.
  await Bun.write(
    join(TEST_ROOT, "corrupt.mp4"),
    new Uint8Array([
      0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0, 105, 115,
      111, 109, 109, 112, 52, 50,
    ])
  );
  if (!FFMPEG) return;

  await runCommand([
    FFMPEG,
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=64x48:rate=10",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=1000:sample_rate=44100",
    "-t",
    "2.2",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    MP4,
  ]);
  await runCommand([
    FFMPEG,
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=65x49:rate=10",
    "-t",
    "1.2",
    "-c:v",
    "ffv1",
    SILENT,
  ]);
});

afterAll(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("video upload validation", () => {
  test("rejects empty input before invoking FFmpeg", async () => {
    const { result, root } = await convert(join(TEST_ROOT, "empty"));
    expect(result.error).toBe("EMPTY_VIDEO");
    expect(await readdir(root)).toEqual([]);
  });

  test("rejects a playlist even with a video filename and MIME type", async () => {
    const { result, root } = await convert(join(TEST_ROOT, "playlist.m3u8"));
    expect(result.error).toBe("UNSUPPORTED_VIDEO_TYPE");
    expect(await readdir(root)).toEqual([]);
  });

  test("cannot raise the server file-size limit through helper options", async () => {
    const { result, root } = await convert(
      join(TEST_ROOT, "corrupt.mp4"),
      { UPLOAD_VIDEO_MAX_FILE_SIZE: "8" },
      "await uploadVideoToHls(file, { maxFileSize: 1024 })"
    );
    expect(result.error).toBe("VIDEO_TOO_LARGE");
    expect(await readdir(root)).toEqual([]);
  });

  test("supports a stricter limit for a caller", async () => {
    const { result } = await convert(
      join(TEST_ROOT, "corrupt.mp4"),
      {},
      "await uploadVideoToHls(file, { maxFileSize: 8 })"
    );
    expect(result.error).toBe("VIDEO_TOO_LARGE");
  });

  test("reports a missing executable and cleans the uploaded source", async () => {
    const { result, root } = await convert(join(TEST_ROOT, "corrupt.mp4"), {
      FFMPEG_PATH: join(TEST_ROOT, "missing-ffmpeg"),
    });
    expect(result.error).toBe("FFMPEG_UNAVAILABLE");
    expect(await readdir(root)).toEqual(["videos"]);
    expect(await readdir(join(root, "videos/hls"))).toEqual([]);
  });

  test("kills a stalled conversion, cleans partial output and releases its slot", async () => {
    const fake = join(TEST_ROOT, "slow-ffmpeg");
    await Bun.write(
      fake,
      `#!${process.execPath}\nawait Bun.write("partial.ts", "partial"); await Bun.sleep(5000);\n`
    );
    await chmod(fake, 0o700);
    const { result, root, results } = await convert(
      join(TEST_ROOT, "corrupt.mp4"),
      { FFMPEG_PATH: fake, UPLOAD_VIDEO_TIMEOUT_MS: "100" },
      "[await uploadVideoToHls(file), await uploadVideoToHls(file)]"
    );
    expect(result.error).toBe("CONVERSION_TIMEOUT");
    expect(results?.[1]?.error).toBe("CONVERSION_TIMEOUT");
    expect(await readdir(root)).toEqual(["videos"]);
    expect(await readdir(join(root, "videos/hls"))).toEqual([]);
  });

  test("rejects concurrent work above the limit without publishing output", async () => {
    const fake = join(TEST_ROOT, "busy-ffmpeg");
    await Bun.write(fake, `#!${process.execPath}\nawait Bun.sleep(5000);\n`);
    await chmod(fake, 0o700);
    const { results, root } = await convert(
      join(TEST_ROOT, "corrupt.mp4"),
      { FFMPEG_PATH: fake, UPLOAD_VIDEO_TIMEOUT_MS: "100" },
      "await Promise.all([uploadVideoToHls(file), uploadVideoToHls(file)])"
    );
    expect(results?.map((result) => result.error).sort()).toEqual([
      "CONVERSION_TIMEOUT",
      "UPLOAD_BUSY",
    ]);
    expect(await readdir(join(root, "videos/hls"))).toEqual([]);
  });

  test("rejects successful processes that omit referenced segments", async () => {
    const fake = join(TEST_ROOT, "incomplete-ffmpeg");
    await Bun.write(
      fake,
      `#!${process.execPath}\nawait Bun.write("index.m3u8", "#EXTM3U\\n#EXTINF:1,\\nsegment00000.ts\\n#EXT-X-ENDLIST\\n");\n`
    );
    await chmod(fake, 0o700);
    const { result, root } = await convert(join(TEST_ROOT, "corrupt.mp4"), {
      FFMPEG_PATH: fake,
    });
    expect(result.error).toBe("CONVERSION_FAILED");
    expect(await readdir(root)).toEqual(["videos"]);
    expect(await readdir(join(root, "videos/hls"))).toEqual([]);
  });
});

VIDEO_TESTS("FFmpeg HLS integration", () => {
  test("creates a playable VOD with audio and ignores the client filename", async () => {
    const { result, root } = await convert(MP4);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.path).toMatch(/^videos\/hls\/[a-f0-9-]+\/index\.m3u8$/);
    expect(result.sourceMimeType).toBe("video/mp4");
    expect(result.mimeType).toBe("application/vnd.apple.mpegurl");
    expect(result.originalName).toBe("../../spoofed.webm");

    const playlistPath = resolve(root, result.path);
    const playlist = await Bun.file(playlistPath).text();
    expect(playlist).toContain("#EXT-X-PLAYLIST-TYPE:VOD");
    expect(playlist).toContain("#EXT-X-ENDLIST");
    expect(playlist).toContain("#EXT-X-INDEPENDENT-SEGMENTS");
    const segments = playlist
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"));
    expect(segments.length).toBeGreaterThan(1);
    for (const segment of segments) {
      expect(
        Bun.file(resolve(root, result.directory, segment)).size
      ).toBeGreaterThan(0);
    }
    const metadata = JSON.parse(
      await runCommand([
        FFPROBE!,
        "-v",
        "error",
        "-show_streams",
        "-of",
        "json",
        playlistPath,
      ])
    ) as { streams: Array<{ codec_name: string; codec_type: string }> };
    expect(metadata.streams.map((stream) => stream.codec_name)).toEqual([
      "h264",
      "aac",
    ]);
    await runCommand([
      FFMPEG!,
      "-v",
      "error",
      "-i",
      playlistPath,
      "-f",
      "null",
      "-",
    ]);
    expect(await readdir(root)).toEqual(["videos"]);
    expect(
      (await readdir(resolve(root, result.directory))).every(
        (name) => name === "index.m3u8" || name.endsWith(".ts")
      )
    ).toBe(true);
  });

  test("accepts a silent video and normalizes odd frame dimensions", async () => {
    const { result, root } = await convert(SILENT);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.sourceMimeType).toBe("video/matroska");
    const metadata = JSON.parse(
      await runCommand([
        FFPROBE!,
        "-v",
        "error",
        "-show_streams",
        "-of",
        "json",
        resolve(root, result.path),
      ])
    ) as {
      streams: Array<{ codec_type: string; width: number; height: number }>;
    };
    expect(metadata.streams).toHaveLength(1);
    expect(metadata.streams[0]?.codec_type).toBe("video");
    expect(metadata.streams[0]!.width % 2).toBe(0);
    expect(metadata.streams[0]!.height % 2).toBe(0);
    expect(metadata.streams[0]!.width).toBeLessThanOrEqual(65);
    expect(metadata.streams[0]!.height).toBeLessThanOrEqual(49);
  });

  test("rejects corrupt video content without leaving public or temporary files", async () => {
    const { result, root } = await convert(join(TEST_ROOT, "corrupt.mp4"));
    expect(result.error).toBe("CONVERSION_FAILED");
    expect(await readdir(root)).toEqual(["videos"]);
    expect(await readdir(join(root, "videos/hls"))).toEqual([]);
  });
});

async function convert(
  input: string,
  env: Record<string, string> = {},
  expression = "await uploadVideoToHls(file)"
) {
  const root = await mkdtemp(join(TEST_ROOT, "upload-"));
  const output = join(root, "result.json");
  const script = `
    import { uploadVideoToHls } from "@be-helpers/video";
    const file = new File([await Bun.file(process.env.VIDEO_TEST_INPUT).arrayBuffer()], "../../spoofed.webm", { type: "video/webm" });
    const result = ${expression};
    await Bun.write(process.env.VIDEO_TEST_OUTPUT, JSON.stringify(result));
  `;
  await runCommand([process.execPath, "-e", script], {
    ...process.env,
    UPLOAD_ROOT: root,
    FFMPEG_PATH: FFMPEG || "ffmpeg",
    UPLOAD_VIDEO_MAX_FILE_SIZE: "1048576",
    UPLOAD_VIDEO_CONCURRENCY: "1",
    UPLOAD_VIDEO_TIMEOUT_MS: "10000",
    UPLOAD_VIDEO_THREADS: "1",
    HLS_SEGMENT_DURATION: "1",
    VIDEO_TEST_INPUT: input,
    VIDEO_TEST_OUTPUT: output,
    ...env,
  });
  const value = (await Bun.file(output).json()) as
    | VideoUploadResult
    | VideoUploadResult[];
  await rm(output);
  return {
    result: Array.isArray(value) ? value[0]! : value,
    results: Array.isArray(value) ? value : undefined,
    root,
  };
}

async function runCommand(command: string[], env?: NodeJS.ProcessEnv) {
  const child = Bun.spawn(command, {
    env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (exitCode !== 0)
    throw new Error(`Command failed (${exitCode}): ${stderr}\n${stdout}`);
  return stdout;
}
