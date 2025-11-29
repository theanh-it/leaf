import "dotenv/config";
import "module-alias/register";
import os from "os";
// @ts-ignore - Elysia export issue
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { nnnRouterPlugin } from "@be-plugins/nnn-router";
import { ejsPlugin } from "@be-plugins/ejs";
import { bladePlugin } from "@be-plugins/blade";
import { errorHandlerPlugin } from "@be-plugins/error-handler";
import { responseHelperPlugin } from "@be-plugins/response-helper";
import { viewHelperPlugin } from "@be-plugins/view-helper";
import { config } from "@be-config/index";
import path from "path";

const app = new Elysia({
  serve: {
    maxRequestBodySize: config.server.maxRequestBodySize,
    idleTimeout: config.server.idleTimeout,
  },
});

// Error handling - phải được thêm đầu tiên
app.use(errorHandlerPlugin());

// Response helper plugin - thêm helper method status()
app.use(responseHelperPlugin());

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

// EJS plugin - phải được thêm trước viewHelperPlugin
app.use(
  ejsPlugin({
    viewsDir: config.ejs.viewsDir,
    cache: config.ejs.cache,
    minify: config.ejs.minify,
  })
);

// View helper plugin - thêm helper method view() giống Laravel
// Phải được thêm sau EJS plugin
app.use(viewHelperPlugin());

// Blade plugin - template engine giống Laravel Blade
// Phải được thêm sau viewHelperPlugin
app.use(
  bladePlugin({
    viewsDir: path.join(process.cwd(), "views/blade"),
    cache: config.ejs.cache,
    minify: config.ejs.minify,
  })
);

// Routes
app.use(nnnRouterPlugin());

const size = os.cpus().length as unknown as string;
process.env.UV_THREADPOOL_SIZE = size;

app.listen(config.server.port, () => {
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on: http://localhost:${config.server.port}`);
  console.log(`Thread pool size: ${size}`);
});
