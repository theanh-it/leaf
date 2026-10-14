import { lstat, readdir, unlink } from "node:fs/promises";
import path from "node:path";

import { config } from "@be-config";
import { logger } from "@be-plugins/logger";

export type ClearBackupOptions = {
  retentionDays?: number;
  databaseDirectory?: string;
  filesDirectory?: string;
};

/** Giữ backup trong N × 24 giờ và ít nhất N file mới nhất cho mỗi loại. */
export const clearBackup = async (
  options: ClearBackupOptions = {}
): Promise<void> => {
  const retentionDays = options.retentionDays ?? config.backup.retentionDays;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  if (
    !Number.isSafeInteger(retentionDays) ||
    retentionDays <= 0 ||
    !Number.isSafeInteger(cutoff)
  ) {
    throw new Error("BACKUP_RETENTION_DAYS must be a positive safe integer");
  }

  const databaseDirectory = path.resolve(
    options.databaseDirectory ??
      process.env.BACKUP_DATABASE_DIRECTORY ??
      path.join(process.cwd(), "backup", "databases")
  );
  const filesDirectory = path.resolve(
    options.filesDirectory ??
      process.env.BACKUP_FILES_DIRECTORY ??
      path.join(process.cwd(), "backup", "files")
  );

  const databasesDeleted = await clearDirectory(
    databaseDirectory,
    /^database-.+\.dump$/,
    cutoff,
    retentionDays
  );
  const filesDeleted = await clearDirectory(
    filesDirectory,
    /^files-.+\.tar\.gz$/,
    cutoff,
    retentionDays
  );

  logger.info("Old backups cleared", {
    retentionDays,
    minimumFilesKept: retentionDays,
    databasesDeleted,
    filesDeleted,
  });
};

async function clearDirectory(
  directory: string,
  backupName: RegExp,
  cutoff: number,
  minimumFilesKept: number
): Promise<number> {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isNotFoundError(error)) return 0;
    throw error;
  }

  const backups: { filePath: string; modifiedAt: number }[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !backupName.test(entry.name)) continue;

    const filePath = path.join(directory, entry.name);

    try {
      const fileStat = await lstat(filePath);
      if (!fileStat.isFile()) continue;
      backups.push({ filePath, modifiedAt: fileStat.mtimeMs });
    } catch (error) {
      // Backup có thể đã bị tiến trình khác xóa trong lúc dọn.
      if (!isNotFoundError(error)) throw error;
    }
  }

  backups.sort(
    (left, right) =>
      right.modifiedAt - left.modifiedAt ||
      right.filePath.localeCompare(left.filePath)
  );

  let deleted = 0;

  for (const backup of backups.slice(minimumFilesKept)) {
    if (backup.modifiedAt >= cutoff) continue;

    try {
      // Không xóa file vừa được cập nhật hoặc thay bằng symlink sau khi quét.
      const fileStat = await lstat(backup.filePath);
      if (!fileStat.isFile() || fileStat.mtimeMs >= cutoff) continue;

      await unlink(backup.filePath);
      deleted += 1;
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }

  return deleted;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

if (import.meta.main) {
  await clearBackup();
}
