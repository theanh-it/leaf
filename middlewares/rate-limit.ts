import type { Context } from "elysia";

import { createErrorMessage } from "@/helpers/response";

type KeyGenerator = (context: Context) => string;

export type RateLimitOptions = {
  /** Kích thước cửa sổ thời gian tính bằng ms. Mặc định 60_000 (1 phút). */
  windowMs?: number;
  /** Số request tối đa được phép trong windowMs. Mặc định 60. */
  max?: number;
  /** Mã lỗi HTTP khi bị block. Mặc định 429. */
  statusCode?: number;
  /** Message i18n key trả về khi bị block. Mặc định "rateLimit.exceeded". */
  message?: string;
  /** Hàm sinh key định danh client. Mặc định dùng IP. */
  keyGenerator?: KeyGenerator;
  /** Tiền tố key trong store, dùng khi share 1 store giữa nhiều limiter. */
  prefix?: string;
};

type Bucket = {
  timestamps: number[];
};

const store = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const IDLE_TTL_MS = 60 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();

    for (const [key, bucket] of store) {
      const lastTs = bucket.timestamps[bucket.timestamps.length - 1] ?? 0;
      if (now - lastTs > IDLE_TTL_MS) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  (cleanupTimer as any)?.unref?.();
}

function getClientIp(context: Context): string {
  const headers = context.request.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  try {
    const server = (context as any).server;
    const ip = server?.requestIP?.(context.request);
    if (ip?.address) return ip.address as string;
  } catch {
    // ignore
  }

  return "unknown";
}

const rateLimit = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 60;
  const statusCode = options.statusCode ?? 429;
  const message = options.message ?? "rateLimit.exceeded";
  const prefix = options.prefix ?? "rl";
  const keyGenerator: KeyGenerator =
    options.keyGenerator ?? ((ctx) => getClientIp(ctx));

  ensureCleanup();

  return async (context: Context) => {
    const rawKey = keyGenerator(context);
    const key = `${prefix}:${rawKey}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let bucket = store.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      store.set(key, bucket);
    }

    while (
      bucket.timestamps.length > 0 &&
      bucket.timestamps[0]! <= windowStart
    ) {
      bucket.timestamps.shift();
    }

    const current = bucket.timestamps.length;
    const resetAt =
      current > 0 ? bucket.timestamps[0]! + windowMs : now + windowMs;

    if (current >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

      context.set.headers["x-ratelimit-limit"] = String(max);
      context.set.headers["x-ratelimit-remaining"] = "0";
      context.set.headers["x-ratelimit-reset"] = String(
        Math.ceil(resetAt / 1000)
      );
      context.set.headers["retry-after"] = String(retryAfterSec);

      const errorMessage = createErrorMessage({
        message,
        result: {
          retryAfter: retryAfterSec,
          limit: max,
          windowMs,
        },
      });

      return context.status(statusCode, errorMessage);
    }

    bucket.timestamps.push(now);

    const remaining = Math.max(0, max - bucket.timestamps.length);
    context.set.headers["x-ratelimit-limit"] = String(max);
    context.set.headers["x-ratelimit-remaining"] = String(remaining);
    context.set.headers["x-ratelimit-reset"] = String(
      Math.ceil(resetAt / 1000)
    );
  };
};

export default rateLimit;
