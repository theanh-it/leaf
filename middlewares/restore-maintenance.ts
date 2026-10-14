import type { Context } from "elysia";

import { isRestoringBackup } from "@be-helpers/backup-operation";
import { createErrorMessage } from "@be-helpers/response";

export default (context: Context) => {
  const pathname = new URL(context.request.url).pathname;
  if (
    !isRestoringBackup() ||
    context.request.method === "OPTIONS" ||
    !pathname.startsWith("/api/") ||
    pathname === "/api/backups/restore"
  )
    return;

  context.set.headers["Retry-After"] = "5";
  return context.status(
    503,
    createErrorMessage({ message: "backups.restoreMaintenance" })
  );
};
