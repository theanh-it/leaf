import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { clearBackup } from "@/backup/clear-backup";

const NOW = new Date("2026-10-14T12:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;
let root: string;
let databaseDirectory: string;
let filesDirectory: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "leaf-clear-backup-"));
  databaseDirectory = join(root, "databases");
  filesDirectory = join(root, "files");
  await Promise.all([mkdir(databaseDirectory), mkdir(filesDirectory)]);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("clearBackup", () => {
  test("clears expired backups in both directories and keeps the cutoff boundary", async () => {
    const clock = spyOn(Date, "now").mockReturnValue(NOW);

    try {
      for (const [directory, prefix, extension] of [
        [databaseDirectory, "database", "dump"],
        [filesDirectory, "files", "tar.gz"],
      ] as const) {
        await writeFile(
          join(directory, `${prefix}-old.${extension}`),
          NOW - 8 * DAY
        );
        await writeFile(
          join(directory, `${prefix}-boundary.${extension}`),
          NOW - 7 * DAY
        );
        await writeFile(
          join(directory, `${prefix}-recent.${extension}`),
          NOW - DAY
        );
        await writeFile(
          join(directory, `${prefix}-future.${extension}`),
          NOW + DAY
        );
        for (let index = 0; index < 7; index += 1) {
          await writeFile(
            join(directory, `${prefix}-extra-${index}.${extension}`),
            NOW - DAY + index * 1000
          );
        }
      }

      await clearBackup({
        retentionDays: 7,
        databaseDirectory,
        filesDirectory,
      });

      for (const [directory, prefix, extension] of [
        [databaseDirectory, "database", "dump"],
        [filesDirectory, "files", "tar.gz"],
      ] as const) {
        expect(
          await Bun.file(join(directory, `${prefix}-old.${extension}`)).exists()
        ).toBe(false);
        for (const label of ["boundary", "recent", "future"]) {
          expect(
            await Bun.file(
              join(directory, `${prefix}-${label}.${extension}`)
            ).exists()
          ).toBe(true);
        }
      }
    } finally {
      clock.mockRestore();
    }
  });

  test("preserves temporary files, unrelated files, directories and symlink targets", async () => {
    const old = NOW - 30 * DAY;
    const protectedFiles = [
      join(databaseDirectory, ".gitignore"),
      join(databaseDirectory, "database-old.dump.tmp"),
      join(databaseDirectory, "notes.txt"),
      join(filesDirectory, "files-old.tar.gz.tmp"),
      join(root, "outside.dump"),
    ];
    for (const file of protectedFiles) await writeFile(file, old);

    const nestedDirectory = join(databaseDirectory, "database-nested.dump");
    await mkdir(nestedDirectory);
    const nestedBackup = join(nestedDirectory, "database-old.dump");
    await writeFile(nestedBackup, old);
    const link = join(databaseDirectory, "database-link.dump");
    await symlink(join(root, "outside.dump"), link);

    await clearBackup({ retentionDays: 7, databaseDirectory, filesDirectory });

    for (const file of [...protectedFiles, nestedBackup, link]) {
      expect(await Bun.file(file).exists()).toBe(true);
    }
  });

  test("keeps N newest backups per kind even when every backup has expired", async () => {
    const clock = spyOn(Date, "now").mockReturnValue(NOW);

    try {
      for (let index = 1; index <= 6; index += 1) {
        await writeFile(
          join(databaseDirectory, `database-${index}.dump`),
          NOW - (10 + index) * DAY
        );
      }
      for (let index = 1; index <= 2; index += 1) {
        await writeFile(
          join(filesDirectory, `files-${index}.tar.gz`),
          NOW - (10 + index) * DAY
        );
      }
      await writeFile(join(databaseDirectory, "database-new.dump.tmp"), NOW);

      // Mô phỏng backup ngừng thành công nhiều ngày và dọn lặp lại.
      for (let run = 0; run < 2; run += 1) {
        await clearBackup({
          retentionDays: 3,
          databaseDirectory,
          filesDirectory,
        });
        for (let index = 1; index <= 6; index += 1) {
          expect(
            await Bun.file(
              join(databaseDirectory, `database-${index}.dump`)
            ).exists()
          ).toBe(index <= 3);
        }
        for (let index = 1; index <= 2; index += 1) {
          expect(
            await Bun.file(
              join(filesDirectory, `files-${index}.tar.gz`)
            ).exists()
          ).toBe(true);
        }
      }
    } finally {
      clock.mockRestore();
    }
  });

  test("rejects invalid retention before deleting any backup", async () => {
    const backup = join(databaseDirectory, "database-old.dump");
    await writeFile(backup, NOW - 30 * DAY);

    for (const retentionDays of [
      0,
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER,
    ]) {
      await expect(
        clearBackup({ retentionDays, databaseDirectory, filesDirectory })
      ).rejects.toThrow(
        "BACKUP_RETENTION_DAYS must be a positive safe integer"
      );
      expect(await Bun.file(backup).exists()).toBe(true);
    }
  });

  test("handles missing backup directories", async () => {
    await clearBackup({
      retentionDays: 7,
      databaseDirectory: join(root, "missing-databases"),
      filesDirectory: join(root, "missing-files"),
    });
  });

  test("CLI reads retention and backup directories from environment", async () => {
    const oldBackup = join(databaseDirectory, "database-old.dump");
    const recentBackup = join(filesDirectory, "files-recent.tar.gz");
    await writeFile(oldBackup, Date.now() - 2 * DAY);
    await writeFile(
      join(databaseDirectory, "database-recent.dump"),
      Date.now()
    );
    await writeFile(recentBackup, Date.now() - DAY / 2);

    const child = Bun.spawn(
      [process.execPath, "run", "backup/clear-backup.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          BACKUP_RETENTION_DAYS: "1",
          BACKUP_DATABASE_DIRECTORY: databaseDirectory,
          BACKUP_FILES_DIRECTORY: filesDirectory,
        },
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const [exitCode, stderr] = await Promise.all([
      child.exited,
      new Response(child.stderr).text(),
    ]);
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(await Bun.file(oldBackup).exists()).toBe(false);
    expect(await Bun.file(recentBackup).exists()).toBe(true);
  });
});

async function writeFile(file: string, modifiedAt: number): Promise<void> {
  await Bun.write(file, "backup");
  const date = new Date(modifiedAt);
  await utimes(file, date, date);
}
