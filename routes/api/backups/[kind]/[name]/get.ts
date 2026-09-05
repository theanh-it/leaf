import type { Context } from "elysia";

import {
  BackupFileNotFoundError,
  getBackupFile,
  isBackupKind,
} from "@be-helpers/backup";
import { createErrorMessage } from "@be-helpers/response";

type DownloadBackupParams = {
  kind: string;
  name: string;
};

export default async (context: Context) => {
  const { kind, name } = context.params as DownloadBackupParams;

  if (!isBackupKind(kind)) return createNotFoundResponse(context);

  try {
    const backup = await getBackupFile(kind, name);

    return new Response(backup.file, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": createContentDisposition(backup.name),
        "Content-Length": String(backup.size),
        "Content-Type": backup.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof BackupFileNotFoundError) {
      return createNotFoundResponse(context);
    }

    throw error;
  }
};

const createNotFoundResponse = (context: Context) => {
  return context.status(
    404,
    createErrorMessage({ message: "backups.fileNotFound" })
  );
};

const createContentDisposition = (name: string): string => {
  return `attachment; filename*=UTF-8''${encodeURIComponent(name)}`;
};
