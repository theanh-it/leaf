import { backupDatabase } from "@/backup/backup-database";
import { backupFiles } from "@/backup/backup-files";
import { clearBackup } from "@/backup/clear-backup";
import { acquireBackupOperation } from "@be-helpers/backup-operation";
import { logger } from "@be-plugins/logger";

export const backup = async () => {
  const release = acquireBackupOperation("backup");
  if (!release) {
    logger.warn("Backup skipped because another backup operation is running");
    return;
  }

  try {
    await backupDatabase();
    await backupFiles();
    await clearBackup();
  } finally {
    release();
  }
};
