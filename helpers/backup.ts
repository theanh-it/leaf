import { lstat, readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

export type BackupKind = "database" | "files";

export interface BackupFileInfo {
  name: string;
  kind: BackupKind;
  format: string;
  size: number;
  modifiedAt: string;
}

export interface BackupGroup {
  items: BackupFileInfo[];
  totalFiles: number;
  totalSize: number;
}

export interface BackupOverview {
  databases: BackupGroup;
  files: BackupGroup;
}

export interface ListBackupsOptions {
  databaseDirectory?: string;
  filesDirectory?: string;
}

export interface BackupFileDownload {
  file: Bun.BunFile;
  name: string;
  size: number;
  mimeType: string;
}

export class BackupFileNotFoundError extends Error {
  constructor() {
    super("Backup file not found");
    this.name = "BackupFileNotFoundError";
  }
}

const MAX_CONCURRENT_STATS = 16;

/** Đọc metadata backup trực tiếp từ filesystem, không truy vấn database. */
export const listBackups = async (
  options: ListBackupsOptions = {}
): Promise<BackupOverview> => {
  const { databaseDirectory, filesDirectory } =
    resolveBackupDirectories(options);

  const [databases, files] = await Promise.all([
    readBackupGroup(databaseDirectory, "database"),
    readBackupGroup(filesDirectory, "files"),
  ]);

  return { databases, files };
};

/** Lấy BunFile an toàn để stream download mà không đọc toàn bộ file vào RAM. */
export const getBackupFile = async (
  kind: BackupKind,
  name: string,
  options: ListBackupsOptions = {}
): Promise<BackupFileDownload> => {
  if (!isSafeBackupName(name)) throw new BackupFileNotFoundError();

  const directories = resolveBackupDirectories(options);
  const directory =
    kind === "database"
      ? directories.databaseDirectory
      : directories.filesDirectory;
  const filePath = resolve(directory, name);

  try {
    const fileStat = await lstat(filePath);
    if (!fileStat.isFile()) throw new BackupFileNotFoundError();

    return {
      file: Bun.file(filePath),
      name,
      size: fileStat.size,
      mimeType: getBackupMimeType(name),
    };
  } catch (error) {
    if (error instanceof BackupFileNotFoundError || isNotFoundError(error)) {
      throw new BackupFileNotFoundError();
    }

    throw error;
  }
};

export const isBackupKind = (value: string): value is BackupKind => {
  return value === "database" || value === "files";
};

const readBackupGroup = async (
  directory: string,
  kind: BackupKind
): Promise<BackupGroup> => {
  let names: string[];

  try {
    const entries = await readdir(directory, { withFileTypes: true });
    names = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          !entry.name.startsWith(".") &&
          !entry.name.endsWith(".tmp")
      )
      .map((entry) => entry.name);
  } catch (error) {
    if (isNotFoundError(error)) return createBackupGroup([]);
    throw error;
  }

  const items = await readFileInfoConcurrently(directory, names, kind);
  items.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));

  return createBackupGroup(items);
};

const readFileInfoConcurrently = async (
  directory: string,
  names: string[],
  kind: BackupKind
): Promise<BackupFileInfo[]> => {
  const items: BackupFileInfo[] = [];
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < names.length) {
      const name = names[nextIndex];
      nextIndex += 1;
      if (!name) continue;

      try {
        const fileStat = await stat(join(directory, name));
        if (!fileStat.isFile()) continue;

        items.push({
          name,
          kind,
          format: getBackupFormat(name),
          size: fileStat.size,
          modifiedAt: fileStat.mtime.toISOString(),
        });
      } catch (error) {
        // File có thể bị xóa giữa readdir và stat. Lần refresh sau sẽ đồng bộ lại.
        if (!isNotFoundError(error)) throw error;
      }
    }
  };

  const workerCount = Math.min(MAX_CONCURRENT_STATS, names.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return items;
};

const createBackupGroup = (items: BackupFileInfo[]): BackupGroup => ({
  items,
  totalFiles: items.length,
  totalSize: items.reduce((total, item) => total + item.size, 0),
});

const getBackupFormat = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".tar.gz")) return "tar.gz";

  return extname(lowerName).slice(1) || "file";
};

const getBackupMimeType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".tar.gz") || lowerName.endsWith(".gz")) {
    return "application/gzip";
  }
  if (lowerName.endsWith(".zip")) return "application/zip";

  return "application/octet-stream";
};

const resolveBackupDirectories = (
  options: ListBackupsOptions
): { databaseDirectory: string; filesDirectory: string } => ({
  databaseDirectory: resolve(
    options.databaseDirectory ??
      process.env.BACKUP_DATABASE_DIRECTORY ??
      join(process.cwd(), "backup", "databases")
  ),
  filesDirectory: resolve(
    options.filesDirectory ??
      process.env.BACKUP_FILES_DIRECTORY ??
      join(process.cwd(), "backup", "files")
  ),
});

const isSafeBackupName = (name: string): boolean => {
  return (
    name.length > 0 &&
    !name.startsWith(".") &&
    !name.endsWith(".tmp") &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("\0") &&
    name !== "." &&
    name !== ".."
  );
};

const isNotFoundError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: string }).code === "ENOENT"
  );
};
