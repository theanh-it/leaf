import "dotenv/config";
import "module-alias/register";
import os from "os";
// @ts-ignore - Elysia export issue
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { nnnRouterPlugin } from "elysia-nnn-router";
import { ejsPlugin } from "./plugins/ejs";
import { errorHandlerPlugin } from "./plugins/error-handler";
import { logger } from "./plugins/logger";
import { config } from "./config";

const app = new Elysia({
  serve: {
    maxRequestBodySize: config.server.maxRequestBodySize,
    idleTimeout: config.server.idleTimeout,
  },
});

// Error handling - phải được thêm đầu tiên
app.use(errorHandlerPlugin());

// CORS với origins cụ thể
app.use(
  cors({
    origin: config.cors.origin,
    methods: [...config.cors.methods],
  })
);

// Serve dist folder (Vite build output)
app.use(staticPlugin(config.static.dist));
// Serve public folder (static assets)
app.use(staticPlugin(config.static.public));

// EJS plugin
app.use(
  ejsPlugin({
    viewsDir: config.ejs.viewsDir,
    cache: config.ejs.cache,
    minify: config.ejs.minify,
  })
);

// Routes
app.use(
  nnnRouterPlugin({
    dir: "routes/api",
    prefix: "/api",
  })
);
app.use(
  nnnRouterPlugin({
    dir: "routes/ssr",
    prefix: "/",
  })
);
// Health check route
app.use(
  nnnRouterPlugin({
    dir: "routes/health",
    prefix: "/health",
  })
);

const size = os.cpus().length as unknown as string;
process.env.UV_THREADPOOL_SIZE = size;

app.listen(config.server.port, () => {
  logger.info("Server started", {
    port: config.server.port,
    environment: config.nodeEnv,
    threadPoolSize: size,
  });
});
