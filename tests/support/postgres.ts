import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const postgresBin =
  process.env.TEST_POSTGRES_BIN ??
  (Bun.which("initdb")
    ? path.dirname(Bun.which("initdb")!)
    : "/Applications/Postgres.app/Contents/Versions/latest/bin");
export const hasPostgres = await Bun.file(
  path.join(postgresBin, "initdb")
).exists();
if (process.env.CI && !hasPostgres)
  throw new Error("PostgreSQL test binaries are required in CI");

export function assertTestDatabase() {
  const url = process.env.DATABASE_URL;
  if (
    process.env.LEAF_DATABASE_TEST_CHILD !== "true" ||
    !url?.startsWith("postgresql://leaf_test@127.0.0.1:") ||
    url !== process.env.LEAF_TEST_DATABASE_URL
  ) {
    throw new Error(
      "API fixtures require an isolated database from withTestDatabase"
    );
  }
}

export async function runCommand(
  command: string[],
  env: NodeJS.ProcessEnv = process.env,
  includeStderr = false
) {
  const child = Bun.spawn(command, { env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) throw new Error(stdout + stderr);
  return includeStderr ? stdout + stderr : stdout;
}

/** Mỗi suite dùng cluster và process riêng; không truy cập DATABASE_URL của repo. */
export async function withTestDatabase(
  run: (env: NodeJS.ProcessEnv) => Promise<void>
) {
  const directory = await mkdtemp(path.join(tmpdir(), "leaf-api-pg-"));
  let postgres: ReturnType<typeof Bun.spawn> | undefined;
  try {
    const data = path.join(directory, "data");
    const sockets = path.join(directory, "sockets");
    await mkdir(sockets);
    await runCommand([
      path.join(postgresBin, "initdb"),
      "-D",
      data,
      "--auth=trust",
      "--username=leaf_test",
      "--no-locale",
    ]);
    const reservation = Bun.serve({ port: 0, fetch: () => new Response() });
    const port = reservation.port;
    reservation.stop(true);
    postgres = Bun.spawn(
      [
        path.join(postgresBin, "postgres"),
        "-D",
        data,
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-k",
        sockets,
      ],
      { stdout: "ignore", stderr: "ignore" }
    );
    const env = {
      ...process.env,
      DATABASE_URL: `postgresql://leaf_test@127.0.0.1:${port}/postgres`,
      LEAF_TEST_DATABASE_URL: `postgresql://leaf_test@127.0.0.1:${port}/postgres`,
      JWT_SECRET: "leaf-isolated-api-test-secret",
      DATABASE_SSL: "false",
      PGHOST: "127.0.0.1",
      PGPORT: String(port),
      PGUSER: "leaf_test",
      PGDATABASE: "postgres",
      TRUSTED_PROXY_IPS: "",
      LEAF_DATABASE_TEST_CHILD: "true",
    };
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        await runCommand(
          [path.join(postgresBin, "psql"), "-c", "SELECT 1"],
          env
        );
        ready = true;
        break;
      } catch {
        await Bun.sleep(50);
      }
    }
    if (!ready) throw new Error("Temporary PostgreSQL did not start");
    await runCommand(
      [
        path.join(postgresBin, "psql"),
        "--set=ON_ERROR_STOP=1",
        "-f",
        "prisma/migrations/20260609082020_init/migration.sql",
      ],
      env
    );
    await run(env);
  } finally {
    if (postgres) {
      postgres.kill("SIGTERM");
      await postgres.exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
}
