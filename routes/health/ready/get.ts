import type { Context } from "elysia";

import { prisma } from "@/database";
import { isRestoringBackup } from "@/helpers/backup-operation";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";
import { logger } from "@/plugins/logger";

export default async (context: Context) => {
  context.set.headers["Cache-Control"] = "no-store";
  if (isRestoringBackup()) {
    return context.status(
      503,
      createErrorMessage({ message: "health.unavailable" })
    );
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return createSuccessMessage({ result: { database: "ready" } });
  } catch (error) {
    logger.error("Readiness database check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return context.status(
      503,
      createErrorMessage({ message: "health.unavailable" })
    );
  }
};
