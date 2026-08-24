export interface CompressionResult {
  file: Blob;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: number;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * High-performance client-side image compressor.
 * Downscales camera images to max 1920px width/height and compresses to quality JPEG
 * to minimize mobile cellular upload latency.
 */
export async function compressImage(
  fileOrBlob: File | Blob,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.82
): Promise<CompressionResult> {
  const originalSizeBytes = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Unable to create 2D canvas context for compression."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed to produce blob."));
              return;
            }
            const compressedSizeBytes = blob.size;
            const savings = Math.max(
              0,
              Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
            );
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file: blob,
              originalSizeBytes,
              compressedSizeBytes,
              savingsPercentage: savings,
              previewUrl,
              width,
              height,
            });
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to decode image data."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file as data URL."));
    reader.readAsDataURL(fileOrBlob);
  });
}

export async function fileToDataUrl(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file as data URL"));
    reader.readAsDataURL(fileOrBlob);
  });
}
