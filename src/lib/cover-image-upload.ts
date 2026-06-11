export const MAX_COVER_UPLOAD_BYTES = 1_500_000;

export const COVER_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function readCoverImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file (JPG, PNG, WebP, or GIF)."));
      return;
    }
    if (file.size > MAX_COVER_UPLOAD_BYTES) {
      const maxMb = Math.round(MAX_COVER_UPLOAD_BYTES / 1024 / 1024);
      reject(
        new Error(
          `Image is too large (max ${maxMb} MB for local upload). Compress it or use an image URL instead.`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}
