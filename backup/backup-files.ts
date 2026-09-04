import { spawn } from "node:child_process";
import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

export type BackupFilesOptions = {
  sourceDirectory?: string;
  outputDirectory?: string;
  tarPath?: string;
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const runTar = (
  executable: string,
  sourceDirectory: string,
  outputPath: string,
) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(
      executable,
      [
        "--create",
        "--gzip",
        "--file",
        outputPath,
        "--directory",
        path.dirname(sourceDirectory),
        path.basename(sourceDirectory),
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
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
          `tar failed${signal ? ` (signal ${signal})` : ""}: ${detail}`,
        ),
      );
    });
  });

/** Create a gzip-compressed archive of the application's uploaded files. */
export const backupFiles = async (
  options: BackupFilesOptions = {},
): Promise<void> => {
  const sourceDirectory = path.resolve(
    options.sourceDirectory ??
      process.env.FILES_DIRECTORY ??
      path.join(process.cwd(), "files"),
  );
  const outputDirectory = path.resolve(
    options.outputDirectory ??
      process.env.BACKUP_FILES_DIRECTORY ??
      path.join(process.cwd(), "backup", "files"),
  );

  if (
    outputDirectory === sourceDirectory ||
    outputDirectory.startsWith(`${sourceDirectory}${path.sep}`)
  ) {
    throw new Error(
      "The file backup directory must not be inside the source directory",
    );
  }

  try {
    await access(sourceDirectory);
  } catch {
    throw new Error(`Files directory does not exist: ${sourceDirectory}`);
  }

  const outputPath = path.join(
    outputDirectory,
    `files-${timestamp()}.tar.gz`,
  );
  const temporaryPath = `${outputPath}.tmp`;

  await mkdir(outputDirectory, { recursive: true });

  try {
    await runTar(
      options.tarPath ?? process.env.TAR_PATH ?? "tar",
      sourceDirectory,
      temporaryPath,
    );
    await rename(temporaryPath, outputPath);
    console.log(`[backup] Files saved to ${outputPath}`);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Cannot run tar. Install tar or set TAR_PATH.", {
        cause: error,
      });
    }

    throw error;
  }
};
