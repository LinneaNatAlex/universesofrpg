import { readCoverImageFile } from "@/lib/cover-image-upload";

const AVATAR_MAX_PX = 256;
const AVATAR_JPEG_QUALITY = 0.86;

/** Resize and compress for profile avatars (smaller localStorage + DB footprint). */
export function compressAvatarFile(file: File): Promise<string> {
  return readCoverImageFile(file).then((dataUrl) =>
    resizeDataUrlToJpeg(dataUrl, AVATAR_MAX_PX, AVATAR_JPEG_QUALITY)
  );
}

export function resizeDataUrlToJpeg(
  dataUrl: string,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height, 1));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not process image."));
    img.src = dataUrl;
  });
}
