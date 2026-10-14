import { backupDatabase } from "@/backup/backup-database";
import { backupFiles } from "@/backup/backup-files";
import { clearBackup } from "@/backup/clear-backup";

export const backup = async () => {
  await backupDatabase();
  await backupFiles();
  await clearBackup();
};
