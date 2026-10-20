import { test } from "bun:test";

import {
  assertTestDatabase,
  hasPostgres,
  runCommand,
  withTestDatabase,
} from "@/tests/support/postgres";

/** Chạy chính file test trong process/DB tạm; các test case vẫn nằm trong file đó. */
export function isolatedDatabaseTests(
  filePath: string,
  name: string,
  beforeRun?: () => Promise<unknown>
): boolean {
  if (process.env.LEAF_DATABASE_TEST_CHILD === "true") {
    assertTestDatabase();
    return true;
  }

  test.skipIf(!hasPostgres)(
    `${name} — PostgreSQL tạm`,
    async () => {
      await beforeRun?.();
      await withTestDatabase(async (env) => {
        const output = await runCommand(
          [process.execPath, "test", filePath],
          env,
          true
        );
        if (output.trim()) process.stdout.write(output);
      });
    },
    30_000
  );
  return false;
}
