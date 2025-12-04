import "dotenv/config";
import "module-alias/register";
import os from "os";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";

import { config } from "@be-config";
import { nnnRouterPlugin } from "@be-plugins/nnn-router";
import { bladePlugin } from "@be-plugins/blade";
import { errorHandlerPlugin } from "@be-plugins/error-handler";

const app = new Elysia({ serve: config.serve });

// Error handling - phải được thêm đầu tiên
app.use(errorHandlerPlugin());

// CORS với origins cụ thể
app.use(cors(config.cors));

// static assets
app.use(staticPlugin(config.static.dist));
app.use(staticPlugin(config.static.public));

// Blade plugin - template engine giống Laravel Blade
app.use(bladePlugin(config.blade));

// Routes
for (const route of config.routes) app.use(nnnRouterPlugin(route));

const size = os.cpus().length as unknown as string;
process.env.UV_THREADPOOL_SIZE = size;

app.listen(config.port, () => {
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on: http://localhost:${config.port}`);
  console.log(`Thread pool size: ${size}`);
});
