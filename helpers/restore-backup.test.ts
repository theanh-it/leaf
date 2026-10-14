import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { chmod, mkdir, mkdtemp, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { create, Header } from "tar";

import { restoreBackup } from "@be-helpers/restore-backup";
import { backupFiles } from "@/backup/backup-files";
import {
  acquireBackupOperation,
  isRestoringBackup,
} from "@be-helpers/backup-operation";
import type { RestorePhase } from "@be-types/backup-restore";

const PG_BIN =
  process.env.TEST_POSTGRES_BIN ??
  "/Applications/Postgres.app/Contents/Versions/latest/bin";
const hasPostgres = await Bun.file(path.join(PG_BIN, "initdb")).exists();
let clusterRoot: string;
let postgres: ReturnType<typeof Bun.spawn> | undefined;
let databaseUrl: string;
let pgEnv: NodeJS.ProcessEnv;
let root: string;
let target: string;
let archivePath: string;
let databasePath: string;

async function command(
  executable: string,
  args: string[],
  env = pgEnv
): Promise<string> {
  const child = Bun.spawn([executable, ...args], {
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0)
    throw new Error(
      `Test command failed: ${path.basename(executable)}: ${stderr}`
    );
  return stdout.trim();
}

async function sql(query: string): Promise<string> {
  return command(path.join(PG_BIN, "psql"), [
    "--no-psqlrc",
    "--tuples-only",
    "--no-align",
    "--set=ON_ERROR_STOP=1",
    "--command",
    query,
  ]);
}

describe.skipIf(!hasPostgres)("restore backup with isolated PostgreSQL", () => {
  beforeAll(async () => {
    clusterRoot = await mkdtemp(path.join(tmpdir(), "leaf-restore-pg-"));
    const data = path.join(clusterRoot, "data");
    await command(
      path.join(PG_BIN, "initdb"),
      [
        "--pgdata",
        data,
        "--auth=trust",
        "--username=leaf_restore_test",
        "--no-locale",
      ],
      process.env
    );
    const reservation = Bun.serve({ port: 0, fetch: () => new Response() });
    const port = reservation.port;
    reservation.stop(true);
    pgEnv = {
      ...process.env,
      PGHOST: "127.0.0.1",
      PGPORT: String(port),
      PGUSER: "leaf_restore_test",
      PGDATABASE: "postgres",
    };
    databaseUrl = `postgresql://leaf_restore_test@127.0.0.1:${port}/postgres`;
    postgres = Bun.spawn(
      [
        path.join(PG_BIN, "postgres"),
        "-D",
        data,
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-k",
        clusterRoot,
      ],
      { stdout: "ignore", stderr: "ignore" }
    );
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        await sql("SELECT 1");
        return;
      } catch {
        await Bun.sleep(50);
      }
    }
    throw new Error("Temporary PostgreSQL did not start");
  }, 20_000);

  afterAll(async () => {
    if (postgres) {
      postgres.kill("SIGTERM");
      await postgres.exited;
    }
    if (clusterRoot) await rm(clusterRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "leaf-restore-case-"));
    target = path.join(root, "live-files");
    const source = path.join(root, "snapshot", "files");
    await mkdir(target);
    await mkdir(source, { recursive: true });
    await Bun.write(path.join(target, "current.txt"), "current");
    await Bun.write(path.join(source, "restored.txt"), "snapshot");
    archivePath = path.join(root, "files.tar.gz");
    await create({ file: archivePath, cwd: path.dirname(source), gzip: true }, [
      "files",
    ]);
    await sql(
      "DROP TABLE IF EXISTS restore_probe; CREATE TABLE restore_probe (id integer PRIMARY KEY, value text); INSERT INTO restore_probe VALUES (1, 'snapshot');"
    );
    databasePath = path.join(root, "database.dump");
    await command(path.join(PG_BIN, "pg_dump"), [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--file",
      databasePath,
    ]);
    await sql("UPDATE restore_probe SET value = 'current'");
  });

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  const options = () => ({
    databasePath,
    archivePath,
    filesDirectory: target,
    databaseUrl,
    pgRestorePath: path.join(PG_BIN, "pg_restore"),
  });

  test("restores the real dump and files, then removes recovery workspace", async () => {
    const phases: RestorePhase[] = [];
    await restoreBackup({
      ...options(),
      onPhase: (phase) => phases.push(phase),
    });
    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "restored.txt")).text()).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "current.txt")).exists()).toBe(
      false
    );
    expect(phases).toEqual(["validating", "files", "database"]);
    expect(
      (await readdir(root)).some((name) => name.startsWith(".leaf-restore-"))
    ).toBe(false);
  });

  test("restores legacy macOS archives with AppleDouble preceding the files root", async () => {
    const source = path.join(root, "snapshot");
    await Bun.write(path.join(source, "._files"), "macOS root metadata");
    await Bun.write(
      path.join(source, "files", "._restored.txt"),
      "macOS file metadata"
    );
    await create({ file: archivePath, cwd: source, gzip: true }, [
      "._files",
      "files",
    ]);

    await restoreBackup(options());

    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "restored.txt")).text()).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "._restored.txt")).exists()).toBe(
      false
    );
  });

  test("restores archives produced by the application's backupFiles command", async () => {
    const outputDirectory = path.join(root, "backups");
    await backupFiles({
      sourceDirectory: path.join(root, "snapshot", "files"),
      outputDirectory,
    });
    const names = await readdir(outputDirectory);
    const archive = names.find((name) => name.endsWith(".tar.gz"));
    if (!archive) throw new Error("No backup archive generated");
    await restoreBackup({
      ...options(),
      archivePath: path.join(outputDirectory, archive),
    });
    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "restored.txt")).text()).toBe(
      "snapshot"
    );
  });

  test("accepts multipart through the real routes and reports successful background restore", async () => {
    // Process riêng bảo đảm config restore trỏ vào fixture, không dùng .env dự án.
    const script = `
      import { Elysia } from "elysia";
      import { nnnRouterPlugin } from "elysia-nnn-router";
      import { signJWT } from "@be-helpers/auth";
      import restoreMaintenance from "@be-middlewares/restore-maintenance";
      const app = new Elysia().onBeforeHandle(restoreMaintenance)
        .use(nnnRouterPlugin({ dir: "routes/api/backups", prefix: "/api/backups", silent: true }));
      const token = await signJWT({ id: "test", username: "admin" });
      const headers = { Authorization: "Bearer " + token };
      const body = new FormData();
      const requestId = crypto.randomUUID();
      body.append("requestId", requestId);
      body.append("database", Bun.file(process.env.TEST_DATABASE_PATH), "database.dump");
      body.append("files", Bun.file(process.env.TEST_ARCHIVE_PATH), "files.tar.gz");
      const accepted = await app.handle(new Request("http://localhost/api/backups/restore", { method: "POST", headers, body }));
      if (accepted.status !== 202) throw new Error("Restore not accepted: " + await accepted.text());
      for (let attempt = 0; attempt < 200; attempt++) {
        const response = await app.handle(new Request("http://localhost/api/backups/restore", { headers }));
        const { result } = await response.json();
        if (result.id !== requestId) throw new Error("Job ID mismatch");
        if (result.status === "success") process.exit(0);
        if (result.status === "error") throw new Error(result.errorCode);
        await Bun.sleep(25);
      }
      throw new Error("Background restore did not finish");
    `;
    await command(process.execPath, ["-e", script], {
      ...process.env,
      DATABASE_URL: databaseUrl,
      FILES_DIRECTORY: target,
      PG_RESTORE_PATH: path.join(PG_BIN, "pg_restore"),
      TEST_DATABASE_PATH: databasePath,
      TEST_ARCHIVE_PATH: archivePath,
      JWT_SECRET: "isolated-restore-test-secret",
    });
    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "snapshot"
    );
    expect(await Bun.file(path.join(target, "restored.txt")).text()).toBe(
      "snapshot"
    );
  });

  test("rolls back database and files when PostgreSQL rejects part of the dump", async () => {
    // Dependency absent from dump prevents DROP TABLE without CASCADE.
    await sql("CREATE VIEW restore_dependency AS SELECT * FROM restore_probe");
    try {
      await expect(restoreBackup(options())).rejects.toMatchObject({
        code: "backups.restoreFailed",
      });
      expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
        "current"
      );
      expect(await Bun.file(path.join(target, "current.txt")).text()).toBe(
        "current"
      );
      expect(await Bun.file(path.join(target, "restored.txt")).exists()).toBe(
        false
      );
    } finally {
      await sql("DROP VIEW restore_dependency");
    }
  });

  test("rejects corrupted database before touching files", async () => {
    await Bun.write(databasePath, "not a dump");
    await expect(restoreBackup(options())).rejects.toMatchObject({
      code: "backups.invalidDatabase",
    });
    expect(await Bun.file(path.join(target, "current.txt")).text()).toBe(
      "current"
    );
    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "current"
    );
  });

  test("rejects symlinks, traversal paths and oversized extracted archives", async () => {
    await expect(
      restoreBackup({ ...options(), maxExtractedSize: 1 })
    ).rejects.toMatchObject({ code: "backups.invalidArchive" });

    const source = path.join(root, "snapshot", "files");
    await symlink(path.join(target, "current.txt"), path.join(source, "link"));
    await create({ file: archivePath, cwd: path.dirname(source), gzip: true }, [
      "files",
    ]);
    await expect(restoreBackup(options())).rejects.toMatchObject({
      code: "backups.invalidArchive",
    });

    const header = new Header({
      path: "files/../../escaped.txt",
      size: 0,
      type: "File",
      mode: 0o644,
    });
    header.encode();
    await Bun.write(
      archivePath,
      Bun.gzipSync(Buffer.concat([header.block!, Buffer.alloc(1024)]))
    );
    await expect(restoreBackup(options())).rejects.toMatchObject({
      code: "backups.invalidArchive",
    });
    expect(await Bun.file(path.join(target, "current.txt")).text()).toBe(
      "current"
    );
    expect(await Bun.file(path.join(root, "escaped.txt")).exists()).toBe(false);
  });

  test("missing pg_restore leaves current data untouched", async () => {
    await expect(
      restoreBackup({
        ...options(),
        pgRestorePath: path.join(root, "missing-pg-restore"),
      })
    ).rejects.toMatchObject({ code: "backups.pgRestoreUnavailable" });
    expect(await sql("SELECT value FROM restore_probe WHERE id=1")).toBe(
      "current"
    );
    expect(await Bun.file(path.join(target, "current.txt")).text()).toBe(
      "current"
    );
  });

  test("process failure during restore returns files to their original state", async () => {
    const executable = path.join(root, "fake-pg-restore");
    await Bun.write(
      executable,
      '#!/bin/sh\nif [ "$1" = "--list" ]; then exit 0; fi\nexit 1\n'
    );
    await chmod(executable, 0o700);
    await expect(
      restoreBackup({ ...options(), pgRestorePath: executable })
    ).rejects.toMatchObject({ code: "backups.restoreFailed" });
    expect(await Bun.file(path.join(target, "current.txt")).text()).toBe(
      "current"
    );
  });
});

test("backup and restore share one exclusive operation lock", () => {
  const release = acquireBackupOperation("restore");
  expect(release).not.toBeNull();
  try {
    expect(isRestoringBackup()).toBe(true);
    expect(acquireBackupOperation("restore")).toBeNull();
    expect(acquireBackupOperation("backup")).toBeNull();
  } finally {
    release?.();
  }
  expect(isRestoringBackup()).toBe(false);
});

test("bundled server and dynamically loaded routes share the same lock", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "leaf-restore-bundle-"));
  try {
    const result = await Bun.build({
      entrypoints: [path.join(process.cwd(), "helpers", "backup-operation.ts")],
      target: "bun",
    });
    expect(result.success).toBe(true);
    const output = result.outputs[0];
    if (!output) throw new Error("No bundle generated");
    const modulePath = path.join(directory, "operation.js");
    await Bun.write(modulePath, output);
    const bundled = (await import(
      pathToFileURL(modulePath).href
    )) as typeof import("@be-helpers/backup-operation");
    const release = bundled.acquireBackupOperation("restore");
    expect(release).not.toBeNull();
    try {
      expect(isRestoringBackup()).toBe(true);
      expect(acquireBackupOperation("backup")).toBeNull();
    } finally {
      release?.();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
