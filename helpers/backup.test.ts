import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BackupFileNotFoundError,
  getBackupFile,
  listBackups,
} from "@be-helpers/backup";

const TEST_ROOT = await mkdtemp(join(tmpdir(), "leaf-backups-"));

afterAll(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("backup filesystem reader", () => {
  test("lists metadata, sorts newest first and ignores internal files", async () => {
    const databaseDirectory = join(TEST_ROOT, "databases");
    const filesDirectory = join(TEST_ROOT, "files");
    await Promise.all([
      mkdir(databaseDirectory, { recursive: true }),
      mkdir(filesDirectory, { recursive: true }),
    ]);

    const oldDatabase = join(databaseDirectory, "database-old.dump");
    const newDatabase = join(databaseDirectory, "database-new.dump");
    const filesArchive = join(filesDirectory, "files-new.tar.gz");

    await Promise.all([
      Bun.write(oldDatabase, "old"),
      Bun.write(newDatabase, "newer"),
      Bun.write(filesArchive, "archive"),
      Bun.write(join(databaseDirectory, ".gitignore"), "*"),
      Bun.write(join(filesDirectory, "unfinished.tar.gz.tmp"), "temporary"),
    ]);

    await Promise.all([
      utimes(oldDatabase, new Date("2026-01-01"), new Date("2026-01-01")),
      utimes(newDatabase, new Date("2026-02-01"), new Date("2026-02-01")),
    ]);

    const result = await listBackups({
      databaseDirectory,
      filesDirectory,
    });

    expect(result.databases.items.map((item) => item.name)).toEqual([
      "database-new.dump",
      "database-old.dump",
    ]);
    expect(result.databases.totalFiles).toBe(2);
    expect(result.databases.totalSize).toBe(8);
    expect(result.files.items[0]?.format).toBe("tar.gz");
    expect(result.files.totalFiles).toBe(1);
    expect(result.files.totalSize).toBe(7);

    const download = await getBackupFile("database", "database-new.dump", {
      databaseDirectory,
      filesDirectory,
    });
    expect(download.mimeType).toBe("application/octet-stream");
    expect(download.size).toBe(5);
    expect(await download.file.text()).toBe("newer");
  });

  test("returns empty groups when backup directories do not exist", async () => {
    const result = await listBackups({
      databaseDirectory: join(TEST_ROOT, "missing-databases"),
      filesDirectory: join(TEST_ROOT, "missing-files"),
    });

    expect(result.databases).toEqual({
      items: [],
      totalFiles: 0,
      totalSize: 0,
    });
    expect(result.files).toEqual({
      items: [],
      totalFiles: 0,
      totalSize: 0,
    });
  });

  test("rejects traversal paths when resolving a download", async () => {
    await expect(
      getBackupFile("database", "../secret.dump", {
        databaseDirectory: TEST_ROOT,
        filesDirectory: TEST_ROOT,
      })
    ).rejects.toBeInstanceOf(BackupFileNotFoundError);
  });
});
