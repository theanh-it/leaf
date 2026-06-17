// SSEController.ts
import type { Context } from "elysia";

export class SSEController {
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private encoder = new TextEncoder();
  private closed = false;

  constructor(
    private context: Context,
    private writable: WritableStream<Uint8Array>
  ) {
    this.writer = writable.getWriter();

    // Cleanup khi client disconnect
    context.request.signal.addEventListener("abort", () => {
      this.close();
    });
  }

  // Gửi text thuần
  send(
    data: string,
    { id, event, retry }: { id?: string; event?: string; retry?: number } = {}
  ) {
    if (this.closed) return this;
    const lines: string[] = [];

    if (id) lines.push(`id: ${id}`);
    if (event) lines.push(`event: ${event}`);
    if (retry) lines.push(`retry: ${retry}`);
    lines.push(`data: ${data}`);
    lines.push(""); // \n\n

    this.writer.write(this.encoder.encode(lines.join("\n") + "\n"));
    return this;
  }

  // Gửi JSON (tự động stringify)
  json(data: any, options = {}) {
    return this.send(JSON.stringify(data), options);
  }

  // Gửi với event name (client dùng addEventListener)
  event(name: string, data: any) {
    return this.json(data, { event: name });
  }

  // Đóng stream
  close() {
    if (this.closed) return;
    this.closed = true;
    this.writer.close().catch(() => {});
  }

  // Kiểm tra kết nối còn sống
  get isAlive() {
    return !this.closed;
  }

  // Tạo stream và trả về Response
  static createResponse(
    context: Context,
    setup?: (sse: SSEController) => void | Promise<void>
  ) {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const sse = new SSEController(context, writable);

    // Gọi setup async (gửi dữ liệu, loop, v.v.)
    if (setup) {
      Promise.resolve(setup(sse)).catch((err) => {
        sse.json({ error: "Stream error" });
        console.error("SSE setup error:", err);
        sse.close();
      });
    }

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
      },
      status: 200,
    });
  }
}

export class SSETransform {
  private readonly encoder = new TextEncoder();
  private readonly stream = new TransformStream<Uint8Array>();
  private readonly writer = this.stream.writable.getWriter();
  private readonly headers: Record<string, string>;
  private closed = false;
  private abortListener: (() => void) | null = null;

  constructor(
    private context: Context,
    extraHeaders: Record<string, string> = {}
  ) {
    const baseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    };

    this.headers = { ...baseHeaders, ...extraHeaders };
    context.set.status = 200;
    Object.entries(this.headers).forEach(([key, value]) => {
      context.set.headers[key] = value;
    });

    const onAbort = () => {
      void this.abort();
    };
    context.request.signal.addEventListener("abort", onAbort);
    this.abortListener = () => {
      context.request.signal.removeEventListener("abort", onAbort);
    };
  }

  async send(data: string) {
    if (this.closed) return;
    await this.writer.write(this.encoder.encode(`data: ${data}\n\n`));
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.abortListener?.();
    this.abortListener = null;
    await this.writer.close().catch(() => {
      /* ignore */
    });
  }

  async abort(reason?: unknown) {
    if (this.closed) return;
    this.closed = true;
    this.abortListener?.();
    this.abortListener = null;
    await this.writer.abort(reason).catch(() => {
      /* ignore */
    });
  }

  get readable() {
    return this.stream.readable;
  }

  get isClosed() {
    return this.closed;
  }

  response(status = 200) {
    return new Response(this.stream.readable, {
      headers: this.headers,
      status,
    });
  }
}

// sse.ts
export class SSEStream {
  private stream: ReadableStream;
  private controller!: ReadableStreamDefaultController;
  private encoder: TextEncoder;
  private headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no",
  };

  constructor(context: Context) {
    Object.entries(this.headers).forEach(([key, value]) => {
      context.set.headers[key] = value;
    });

    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
    });

    this.encoder = new TextEncoder();
  }

  // Giống res.write()
  write(data: string) {
    this.controller.enqueue(this.encoder.encode(`data: ${data}\n\n`));
  }

  // Gửi event có tên
  event(eventName: string, data: string) {
    this.controller.enqueue(
      this.encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`)
    );
  }

  // Đóng stream
  close() {
    this.controller.close();
  }

  // Trả response chuẩn SSE
  response(headers: Record<string, string> = {}) {
    return new Response(this.stream, {
      headers: Object.assign(this.headers, headers),
    });
  }
}

export class Stream {
  private readable: ReadableStream;
  private writable: WritableStream;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private encoder: TextEncoder;
  private closed = false;

  constructor(context: Context) {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    this.readable = readable;
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();

    context.set.status = 200;
    context.set.headers["Content-Type"] = "text/event-stream";
    context.set.headers["Cache-Control"] = "no-cache";
    context.set.headers["Connection"] = "keep-alive";
    context.set.headers["Access-Control-Allow-Origin"] = "*";
    context.set.headers["Transfer-Encoding"] = "chunked";
    context.set.headers["X-Accel-Buffering"] = "no";

    context.request.signal.addEventListener("abort", () => {
      this.close();
    });
  }

  write(data: string) {
    if (this.closed) return;

    this.writer.write(this.encoder.encode(`data: ${data}\n\n`));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.writer.close().catch(() => {});
  }

  response() {
    return new Response(this.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  }

  get readableStream() {
    return this.readable;
  }

  get writableStream() {
    return this.writable;
  }
}
