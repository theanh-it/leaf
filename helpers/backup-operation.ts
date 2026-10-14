import type { RestoreJob } from "@be-types/backup-restore";

type BackupOperation = "backup" | "restore";

type BackupState = {
  operation: { kind: BackupOperation; token: symbol } | null;
  restoreJob: RestoreJob | null;
};

const globalForBackup = globalThis as typeof globalThis & {
  leafBackupState?: BackupState;
};

// Server bundle và route nạp động phải dùng cùng trạng thái trong production.
export const backupState = (globalForBackup.leafBackupState ??= {
  operation: null,
  restoreJob: null,
});

export const isRestoringBackup = (): boolean =>
  backupState.operation?.kind === "restore";

/** Khóa dùng chung cho cron backup và restore trong một server process. */
export const acquireBackupOperation = (
  kind: BackupOperation
): (() => void) | null => {
  if (backupState.operation) return null;
  const token = Symbol(kind);
  backupState.operation = { kind, token };

  return () => {
    if (backupState.operation?.token === token) backupState.operation = null;
  };
};
