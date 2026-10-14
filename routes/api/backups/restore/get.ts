import { getRestoreJob } from "@be-helpers/restore-backup";
import { createSuccessMessage } from "@be-helpers/response";

export default async () =>
  createSuccessMessage({
    message: "backups.restoreStatus",
    result: getRestoreJob(),
  });
