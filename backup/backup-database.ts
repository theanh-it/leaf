import { spawn } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

export type BackupDatabaseOptions = {
  databaseUrl?: string;
  outputDirectory?: string;
  pgDumpPath?: string;
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const databaseEnvironment = (databaseUrl: string): NodeJS.ProcessEnv => {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !database) {
    throw new Error("DATABASE_URL must include a host and database name");
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: database,
  };

  if (url.username) env.PGUSER = decodeURIComponent(url.username);
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);

  // Keep the most common libpq SSL options without exposing credentials in
  // the process argument list.
  const sslEnvironment: Record<string, string> = {
    sslmode: "PGSSLMODE",
    sslcert: "PGSSLCERT",
    sslkey: "PGSSLKEY",
    sslrootcert: "PGSSLROOTCERT",
    sslcrl: "PGSSLCRL",
  };

  for (const [queryParameter, environmentVariable] of Object.entries(
    sslEnvironment,
  )) {
    const value = url.searchParams.get(queryParameter);
    if (value) env[environmentVariable] = value;
  }

  return env;
};

const runPgDump = (
  executable: string,
  outputPath: string,
  env: NodeJS.ProcessEnv,
) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(
      executable,
      [
        "--format=custom",
        "--compress=6",
        "--no-owner",
        "--no-privileges",
        "--file",
        outputPath,
      ],
      {
        env,
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.once("error", (error) => reject(error));
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim() || `process exited with code ${code}`;
      reject(
        new Error(
          `pg_dump failed${signal ? ` (signal ${signal})` : ""}: ${detail}`,
        ),
      );
    });
  });

/**
 * Create a compressed PostgreSQL backup that can be restored with pg_restore.
 */
export const backupDatabase = async (
  options: BackupDatabaseOptions = {},
): Promise<void> => {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to back up the database");
  }

  const outputDirectory = path.resolve(
    options.outputDirectory ??
      process.env.BACKUP_DATABASE_DIRECTORY ??
      path.join(process.cwd(), "backup", "databases"),
  );
  const outputPath = path.join(
    outputDirectory,
    `database-${timestamp()}.dump`,
  );
  const temporaryPath = `${outputPath}.tmp`;

  await mkdir(outputDirectory, { recursive: true });

  try {
    await runPgDump(
      options.pgDumpPath ?? process.env.PG_DUMP_PATH ?? "pg_dump",
      temporaryPath,
      databaseEnvironment(databaseUrl),
    );
    await rename(temporaryPath, outputPath);
    console.log(`[backup] Database saved to ${outputPath}`);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        "Cannot run pg_dump. Install the PostgreSQL client or set PG_DUMP_PATH.",
        { cause: error },
      );
    }

    throw error;
  }
};
