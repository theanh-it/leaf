import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";

import { disconnectDatabase } from "@/database";
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

// static - frontend dist (SPA)
app.use(staticPlugin(config.static.dist));

// Routes
for (const route of config.routes) app.use(nnnRouterPlugin(route));

app.listen(config.port, () => {
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on: http://localhost:${config.port}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);

  try {
    app.stop();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
