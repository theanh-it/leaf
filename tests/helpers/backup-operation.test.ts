/** helpers/backup-operation.ts: backup và restore dùng chung một khóa, kể cả sau khi bundle. */
import { test, expect } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  acquireBackupOperation,
  isRestoringBackup,
} from "@be-helpers/backup-operation";

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
