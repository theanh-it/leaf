import {
  resizeImage as resizeImagePica,
  MIME_TYPE,
  OUTPUT_TYPE,
} from "pica-resize-image";

export const isBlob = (link: string) => {
  return link.startsWith("blob:");
};

export const createBlobImageUrl = (file: File) => {
  const blob = new Blob([file], { type: file.type });

  return URL.createObjectURL(blob);
};

export const resizeImage = async (file: File) => {
  const image = await resizeImagePica(file, {
    width: 600,
    output: OUTPUT_TYPE.file,
    mimeType: MIME_TYPE.webp,
    quality: 0.8,
  });

  return image;
};

/** Lấy frame đầu video làm ảnh thumbnail (webp). */
export const captureVideoThumbnail = async (
  file: File,
  seekSeconds = 0.5
): Promise<File> => {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onFail = () => {
        cleanup();
        reject(new Error("Không đọc được video"));
      };
      const cleanup = () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("error", onFail);
      };
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("error", onFail);
    });

    const duration = video.duration;
    video.currentTime =
      Number.isFinite(duration) && duration > seekSeconds ? seekSeconds : 0;

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onFail = () => {
        cleanup();
        reject(new Error("Không lấy được frame video"));
      };
      const cleanup = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onFail);
      };
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onFail);
    });

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      throw new Error("Video không có kích thước hợp lệ");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không tạo được canvas");

    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.8);
    });

    if (!blob) throw new Error("Không tạo được ảnh thumbnail");

    return new File([blob], `video-thumb-${Date.now()}.webp`, {
      type: "image/webp",
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};
