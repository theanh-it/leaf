import { backupDatabase } from "@/backup/backup-database";
import { backupFiles } from "@/backup/backup-files";

export const backup = async () => {
  await backupDatabase();
  await backupFiles();
};
