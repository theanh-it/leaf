import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";

import { config } from "@be-config";

import { nnnRouterPlugin } from "elysia-nnn-router";
import { bladePlugin } from "@be-plugins/blade";
import { errorHandlerPlugin } from "@be-plugins/error-handler";

const app = new Elysia({ serve: config.serve });

// Error handling - phải được thêm đầu tiên
app.use(errorHandlerPlugin());

// CORS với origins cụ thể
app.use(cors(config.cors));

// Blade plugin - template engine giống Laravel Blade
app.use(bladePlugin(config.blade));

// static
app.use(staticPlugin(config.static.dist));

// Routes
for (const route of config.routes) app.use(nnnRouterPlugin(route));

app.listen(config.port, () => {
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on: http://localhost:${config.port}`);
});
