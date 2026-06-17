import { chunkArray } from "@/utils";

const ROOT_FOLDER = "./files";
const FILE_NAME_MODE = {
  original: "original",
  random: "random",
};

type UploadFileOptions = {
  folder: string;
  name?: string; // "original" | "random" | "custom-name"
};

const createFoldersIfNotExists = async (folder: string) => {
  const path = `${ROOT_FOLDER}/${folder}`;
  const isExists = await Bun.file(path).exists();

  if (!isExists) {
    await Bun.$`mkdir -p ${path}`.quiet();
  }

  return folder;
};

const getFileExtension = (file: File) => {
  const name = file.name;
  const extension = name.split(".").pop();
  return extension?.toLowerCase();
};

const getFileName = (file: File, options: UploadFileOptions) => {
  if (options.name === FILE_NAME_MODE.original) {
    return file.name;
  } else if (!options.name) {
    return `${Bun.randomUUIDv7()}.${getFileExtension(file)}`;
  } else {
    return options.name;
  }
};

// === Ghi stream vào file (Bun tự tạo thư mục) ===
const writeStreamToFile = async (
  stream: ReadableStream<Uint8Array>,
  filePath: string
) => {
  const fullPath = `${ROOT_FOLDER}/${filePath}`;
  const writer = Bun.file(fullPath).writer();
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      writer.write(value);
    }

    await writer.end();
  } finally {
    reader.releaseLock();
  }
};

const writeStreamToFileV2 = async (
  stream: ReadableStream<Uint8Array>,
  filePath: string
) => {
  const fullPath = `${ROOT_FOLDER}/${filePath}`;
  const response = new Response(stream);
  await Bun.write(fullPath, response);
};

const writeBufferToFile = async (buffer: Buffer, filePath: string) => {
  const fullPath = `${ROOT_FOLDER}/${filePath}`;
  await Bun.write(fullPath, buffer);
};

const uploadFile = async (file: File, options: UploadFileOptions) => {
  try {
    const fileName = getFileName(file, options);
    const filePath = `${options.folder}/${fileName}`;

    let stream: ReadableStream<Uint8Array> = file.stream();

    await writeStreamToFileV2(stream, filePath);

    return {
      success: true,
      message: "File uploaded successfully",
      error: null,
      path: filePath,
      name: fileName,
    };
  } catch (error) {
    console.log("error", error);
    return {
      success: false,
      message: "Failed to upload file",
      error,
      path: null,
      name: null,
    };
  }
};

const removeFile = async (fullPath: string) => {
  try {
    await Bun.file(fullPath).delete();
    return {
      success: true,
      message: "File removed successfully",
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to remove file",
      error,
    };
  }
};

const createImagesFolder = async () => {
  const folder = "images";

  await createFoldersIfNotExists(folder);

  return folder;
};

export const uploadImage = async (file: File) => {
  const folder = await createImagesFolder();

  return uploadFile(file, { folder });
};

export const uploadImages = async (files: File[], totalChunks: number = 5) => {
  const folder = await createImagesFolder();

  const chunks = chunkArray(files, totalChunks);

  let results: any[] = [];

  for (const chunk of chunks) {
    const items = await Promise.all(
      chunk.map((file) => uploadFile(file, { folder }))
    );

    results = results.concat(items);
  }

  return results;
};

export const removeImage = async (name: string) => {
  const fullPath = `${ROOT_FOLDER}/images/${name}`;
  return removeFile(fullPath);
};

export const removeImages = async (
  names: string[],
  totalChunks: number = 5
) => {
  const chunks = chunkArray(names, totalChunks);

  let results: any[] = [];

  for (const chunk of chunks) {
    const items = await Promise.all(chunk.map((name) => removeImage(name)));
    results = results.concat(items);
  }

  return results;
};

const createVideosFolder = () => {
  const folder = "videos";

  createFoldersIfNotExists(folder);

  return folder;
};

export const uploadVideo = async (file: File) => {
  const folder = createVideosFolder();
  return uploadFile(file, { folder });
};

export const uploadVideos = async (files: File[], totalChunks: number = 5) => {
  const folder = createVideosFolder();

  const chunks = chunkArray(files, totalChunks);

  let results: any[] = [];

  for (const chunk of chunks) {
    const items = await Promise.all(
      chunk.map((file) => uploadFile(file, { folder }))
    );

    results = results.concat(items);
  }

  return results;
};

export const removeVideo = async (name: string) => {
  const fullPath = `${ROOT_FOLDER}/videos/${name}`;
  return removeFile(fullPath);
};

export const removeVideos = async (
  names: string[],
  totalChunks: number = 5
) => {
  const chunks = chunkArray(names, totalChunks);
  let results: any[] = [];

  for (const chunk of chunks) {
    const items = await Promise.all(chunk.map((name) => removeVideo(name)));
    results = results.concat(items);
  }

  return results;
};
