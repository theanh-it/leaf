import type { Context } from "elysia";
import { z } from "zod";

import { config } from "@be-config";
import { validateData } from "@be-helpers/request";
import { createErrorMessage, createSuccessMessage } from "@be-helpers/response";
import {
  RestoreBackupError,
  startRestoreBackup,
} from "@be-helpers/restore-backup";

const schema = z.object({
  requestId: z.uuid("validation.error"),
  database: z
    .file()
    .min(5, "backups.invalidDatabase")
    .max(config.backup.restoreMaxFileSize, "backups.restoreFileTooLarge")
    .refine(
      (file) => file.name.toLowerCase().endsWith(".dump"),
      "backups.invalidDatabase"
    ),
  files: z
    .file()
    .min(1, "backups.invalidArchive")
    .max(config.backup.restoreMaxFileSize, "backups.restoreFileTooLarge")
    .refine(
      (file) => file.name.toLowerCase().endsWith(".tar.gz"),
      "backups.invalidArchive"
    ),
});

export default async (context: Context) => {
  const validation = await validateData<z.infer<typeof schema>>(
    context.body as object,
    schema
  );
  if (validation.errors) {
    return context.status(
      422,
      createErrorMessage({
        status: "validation_error",
        message: "validation.error",
        result: validation.errors,
      })
    );
  }

  try {
    const job = startRestoreBackup(
      validation.output.database,
      validation.output.files,
      validation.output.requestId
    );
    return context.status(
      202,
      createSuccessMessage({ message: "backups.restoreStarted", result: job })
    );
  } catch (error) {
    if (error instanceof RestoreBackupError) {
      return context.status(409, createErrorMessage({ message: error.code }));
    }
    throw error;
  }
};
