import { lstat, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extract, list } from "tar";
import type { ReadEntry } from "tar";

import { config } from "@be-config";
import { databaseEnvironment } from "@/backup/backup-database";
import {
  acquireBackupOperation,
  backupState,
} from "@be-helpers/backup-operation";
import { logger } from "@be-plugins/logger";
import type { RestoreJob, RestorePhase } from "@be-types/backup-restore";

type ArchiveFailureReason =
  | "unsafe_entry"
  | "multiple_roots"
  | "extracted_size_limit"
  | "entry_count_limit"
  | "archive_parse_error"
  | "archive_empty";

export class RestoreBackupError extends Error {
  public readonly reason?: ArchiveFailureReason;

  constructor(
    public readonly code: string,
    options?: ErrorOptions & { reason?: ArchiveFailureReason }
  ) {
    super(code, options);
    this.reason = options?.reason;
  }
}

export interface RestoreBackupOptions {
  databasePath: string;
  archivePath: string;
  filesDirectory?: string;
  databaseUrl?: string;
  pgRestorePath?: string;
  maxExtractedSize?: number;
  onPhase?: (phase: RestorePhase) => void;
}

export const getRestoreJob = (): RestoreJob | null =>
  backupState.restoreJob ? { ...backupState.restoreJob } : null;

export const startRestoreBackup = (
  database: File,
  files: File,
  requestId: string = crypto.randomUUID()
): RestoreJob => {
  const release = acquireBackupOperation("restore");
  if (!release) throw new RestoreBackupError("backups.operationBusy");

  const job: RestoreJob = {
    id: requestId,
    status: "running",
    phase: "preparing",
  };
  backupState.restoreJob = job;
  void runUploadedRestore(job, database, files).finally(release);
  return { ...job };
};

/** Chuẩn bị files trước; pg_restore chạy một transaction để rollback khi lỗi. */
export const restoreBackup = async (
  options: RestoreBackupOptions
): Promise<void> => {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl)
    throw new RestoreBackupError("backups.restoreConfiguration");
  const env = databaseEnvironment(databaseUrl);
  const executable = options.pgRestorePath ?? config.backup.pgRestorePath;
  const target = path.resolve(
    options.filesDirectory ?? config.backup.filesDirectory
  );
  if (path.dirname(target) === target || target === process.cwd()) {
    throw new RestoreBackupError("backups.restoreConfiguration");
  }

  options.onPhase?.("validating");
  const header = await Bun.file(options.databasePath).slice(0, 5).text();
  if (header !== "PGDMP")
    throw new RestoreBackupError("backups.invalidDatabase");
  await runPgRestore(
    executable,
    ["--list", options.databasePath],
    env,
    "backups.invalidDatabase"
  );
  const archiveRoot = await validateArchive(
    options.archivePath,
    options.maxExtractedSize ?? config.backup.restoreMaxExtractedSize
  );

  await mkdir(path.dirname(target), { recursive: true });
  const workspace = await mkdtemp(
    path.join(path.dirname(target), ".leaf-restore-")
  );
  const staged = path.join(workspace, "extracted");
  const previous = path.join(workspace, "previous");
  let hadPrevious = false;
  let filesReplaced = false;
  let preserveWorkspace = false;

  try {
    await mkdir(staged);
    await extract({
      file: options.archivePath,
      cwd: staged,
      strict: true,
      preservePaths: false,
      noChmod: true,
      noMtime: true,
      filter: (_name, entry) =>
        "path" in entry && isSafeEntry(entry, archiveRoot),
    });
    const extractedRoot = path.join(staged, archiveRoot);
    const extractedStat = await lstat(extractedRoot);
    if (!extractedStat.isDirectory() || extractedStat.isSymbolicLink()) {
      throw new RestoreBackupError("backups.invalidArchive");
    }

    options.onPhase?.("files");
    try {
      const targetStat = await lstat(target);
      if (!targetStat.isDirectory() || targetStat.isSymbolicLink()) {
        throw new RestoreBackupError("backups.restoreConfiguration");
      }
      await rename(target, previous);
      hadPrevious = true;
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }

    await rename(extractedRoot, target);
    filesReplaced = true;
    options.onPhase?.("database");
    await runPgRestore(
      executable,
      [
        "--clean",
        "--if-exists",
        "--single-transaction",
        "--exit-on-error",
        "--no-owner",
        "--no-privileges",
        "--dbname",
        env.PGDATABASE!,
        options.databasePath,
      ],
      env,
      "backups.restoreFailed"
    );
  } catch (error) {
    try {
      if (filesReplaced) await rm(target, { recursive: true, force: true });
      if (hadPrevious) await rename(previous, target);
    } catch (rollbackError) {
      preserveWorkspace = true;
      logger.error(
        "Files rollback failed; previous files retained for recovery",
        {
          workspace,
          error:
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError),
        }
      );
      throw new RestoreBackupError("backups.restoreRollbackFailed", {
        cause: error,
      });
    }
    throw error;
  } finally {
    if (!preserveWorkspace) {
      await rm(workspace, { recursive: true, force: true }).catch(
        (error: unknown) => {
          logger.warn("Could not clean restore workspace", {
            workspace,
            error: String(error),
          });
        }
      );
    }
  }
};

async function runUploadedRestore(
  job: RestoreJob,
  database: File,
  files: File
): Promise<void> {
  let workspace: string | undefined;
  try {
    workspace = await mkdtemp(path.join(tmpdir(), "leaf-restore-upload-"));
    const databasePath = path.join(workspace, "database.dump");
    const archivePath = path.join(workspace, "files.tar.gz");
    await Bun.write(databasePath, database);
    await Bun.write(archivePath, files);
    await restoreBackup({
      databasePath,
      archivePath,
      onPhase: (phase) => {
        job.phase = phase;
      },
    });
    job.phase = "completed";
    job.status = "success";
    logger.info("Backup restored", { jobId: job.id });
  } catch (error) {
    job.status = "error";
    job.errorCode =
      error instanceof RestoreBackupError
        ? error.code
        : "backups.restoreFailed";
    // Không đưa stderr pg_restore hoặc dữ liệu trong dump vào response/log.
    logger.error("Backup restore failed", {
      jobId: job.id,
      phase: job.phase,
      code: job.errorCode,
      reason: error instanceof RestoreBackupError ? error.reason : undefined,
    });
  } finally {
    if (workspace)
      await rm(workspace, { recursive: true, force: true }).catch(
        () => undefined
      );
  }
}

async function validateArchive(file: string, maxSize: number): Promise<string> {
  let root: string | undefined;
  let reason: ArchiveFailureReason | undefined;
  let totalSize = 0;
  let entries = 0;

  try {
    await list({
      file,
      strict: true,
      onReadEntry: (entry) => {
        entries += 1;
        totalSize += entry.size;
        if (totalSize > maxSize) reason ??= "extracted_size_limit";
        if (entries > 1_000_000) reason ??= "entry_count_limit";
        if (!hasSafeEntryPath(entry)) {
          reason ??= "unsafe_entry";
          return;
        }
        // AppleDouble có thể đứng trước root (._files) trong archive macOS.
        // Vẫn kiểm tra đường dẫn và tính size/count, nhưng không khôi phục metadata.
        if (isAppleDoubleEntry(entry)) return;

        const entryRoot = normalizeEntryPath(entry.path).split("/")[0];
        root ??= entryRoot;
        if (!root || !isSafeEntry(entry, root)) reason ??= "multiple_roots";
      },
    });
  } catch (error) {
    throw new RestoreBackupError("backups.invalidArchive", {
      cause: error,
      reason: "archive_parse_error",
    });
  }

  if (reason || !root || !entries) {
    throw new RestoreBackupError("backups.invalidArchive", {
      reason: reason ?? "archive_empty",
    });
  }
  return root;
}

function isSafeEntry(entry: ReadEntry, root: string): boolean {
  const name = normalizeEntryPath(entry.path);
  return (
    hasSafeEntryPath(entry) &&
    !isAppleDoubleEntry(entry) &&
    (name === root || name.startsWith(`${root}/`))
  );
}

function hasSafeEntryPath(entry: ReadEntry): boolean {
  const name = normalizeEntryPath(entry.path);
  return (
    (entry.type === "File" || entry.type === "Directory") &&
    !entry.linkpath &&
    !name.includes("\\") &&
    !name.includes("\0") &&
    !path.posix.isAbsolute(name) &&
    !/^[a-z]:/i.test(name) &&
    !name.split("/").some((part) => part === ".." || part === ".")
  );
}

function normalizeEntryPath(name: string): string {
  return name.replace(/^(\.\/)+/, "");
}

function isAppleDoubleEntry(entry: ReadEntry): boolean {
  return (
    entry.type === "File" &&
    path.posix.basename(normalizeEntryPath(entry.path)).startsWith("._")
  );
}

async function runPgRestore(
  executable: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  errorCode: string
): Promise<void> {
  try {
    const child = Bun.spawn([executable, ...args], {
      env,
      stdout: "ignore",
      stderr: "ignore",
    });
    const exitCode = await child.exited;
    if (exitCode !== 0) throw new RestoreBackupError(errorCode);
  } catch (error) {
    if (error instanceof RestoreBackupError) throw error;
    throw new RestoreBackupError("backups.pgRestoreUnavailable", {
      cause: error,
    });
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
