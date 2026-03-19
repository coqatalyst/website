/**
 * Image processing utilities for compression and cropping
 * Keeps final images below 3MB
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
  quality?: number;
}

const DEFAULT_MAX_SIZE = 3 * 1024 * 1024; // 3MB
const DEFAULT_QUALITY = 0.8;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;

/**
 * Compress an image blob/file
 * @param file Image file to compress
 * @param options Compression options
 * @returns Compressed blob
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    quality = DEFAULT_QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different formats and qualities to meet size requirement
        let finalBlob: Blob | null = null;
        let attempts = 0;
        const maxAttempts = 5;
        let currentQuality = quality;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              // If blob is under size limit, resolve
              if (blob.size <= maxSizeBytes) {
                resolve(blob);
                return;
              }

              // If we haven't tried reducing quality yet, try that
              if (currentQuality > 0.3) {
                currentQuality -= 0.15;
                attempts++;
                if (attempts < maxAttempts) {
                  tryCompress();
                  return;
                }
              }

              // Return what we have even if over limit (it's the best we can do)
              resolve(blob);
            },
            "image/jpeg",
            currentQuality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      const src = e.target?.result;
      if (typeof src === "string") {
        img.src = src;
      } else {
        reject(new Error("Invalid image data"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Crop an image and return the cropped blob
 * @param file Image file to crop
 * @param cropArea Area to crop
 * @returns Cropped blob
 */
export async function cropImage(
  file: File | Blob,
  cropArea: CropArea
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to crop image"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.95
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      const src = e.target?.result;
      if (typeof src === "string") {
        img.src = src;
      } else {
        reject(new Error("Invalid image data"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Crop and then compress an image
 * @param file Image file
 * @param cropArea Area to crop
 * @param compressionOptions Compression options
 * @returns Cropped and compressed blob
 */
export async function cropAndCompressImage(
  file: File | Blob,
  cropArea: CropArea,
  compressionOptions: CompressionOptions = {}
): Promise<Blob> {
  const cropped = await cropImage(file, cropArea);
  return compressImage(cropped, compressionOptions);
}

/**
 * Get image dimensions
 * @param file Image file
 * @returns Image dimensions
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      const src = e.target?.result;
      if (typeof src === "string") {
        img.src = src;
      } else {
        reject(new Error("Invalid image data"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human readable size
 * @param bytes Number of bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Check if file size is within limit
 * @param bytes File size in bytes
 * @param limitMB Limit in megabytes
 * @returns True if under limit
 */
export function isFileSizeValid(bytes: number, limitMB: number = 3): boolean {
  return bytes <= limitMB * 1024 * 1024;
}

/**
 * Convert blob to base64 data URL
 * @param blob Blob to convert
 * @returns Base64 data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read blob"));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a preview canvas with crop overlay
 * @param file Image file
 * @returns Canvas element with image
 */
export async function createImagePreview(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      const src = e.target?.result;
      if (typeof src === "string") {
        img.src = src;
      } else {
        reject(new Error("Invalid image data"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
