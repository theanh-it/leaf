import { afterAll, describe, expect, test } from "bun:test";
import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "@be-config";
import { uploadImage, uploadImages } from "@be-helpers/image";

const TEST_FOLDER = `image-helper-${Bun.randomUUIDv7()}`;
const TEST_DIRECTORY = resolve(
  config.upload.root,
  config.upload.image.folder,
  TEST_FOLDER
);
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

afterAll(async () => {
  await rm(TEST_DIRECTORY, { recursive: true, force: true });
});

describe("image upload helper", () => {
  test("uses magic bytes for the stored extension and writes atomically", async () => {
    const file = new File([PNG_BYTES], "incorrect-extension.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadImage(file, { folder: TEST_FOLDER });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.name.endsWith(".png")).toBe(true);
    expect(result.mimeType).toBe("image/png");
    expect(result.path).toBe(`images/${TEST_FOLDER}/${result.name}`);
    expect(
      await Bun.file(resolve(config.upload.root, result.path)).bytes()
    ).toEqual(PNG_BYTES);

    const files = await readdir(TEST_DIRECTORY);
    expect(files.some((name) => name.endsWith(".tmp"))).toBe(false);
  });

  test("rejects a folder outside the image root", async () => {
    const file = new File([PNG_BYTES], "image.png", { type: "image/png" });
    const result = await uploadImage(file, { folder: "../../outside" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_FOLDER");
  });

  test("rejects an image above a route-specific lower limit", async () => {
    const file = new File([PNG_BYTES], "image.png", { type: "image/png" });
    const result = await uploadImage(file, { maxFileSize: 8 });

    expect(result.success).toBe(false);
    expect(result.error).toBe("IMAGE_TOO_LARGE");
  });

  test("rejects a batch above its configured lower limit", async () => {
    const files = [
      new File([PNG_BYTES], "first.png", { type: "image/png" }),
      new File([PNG_BYTES], "second.png", { type: "image/png" }),
    ];

    const results = await uploadImages(files, { maxFiles: 1 });

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.error === "TOO_MANY_IMAGES")).toBe(
      true
    );
  });
});
