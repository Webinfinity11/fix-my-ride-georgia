/**
 * Client-side image compression and WebP conversion utility.
 * Resizes images to a max dimension and converts to WebP format
 * before uploading to Supabase Storage.
 */

import serviceThumbnails from '@/data/service-thumbnails.json';
import serviceDisplayImages from '@/data/service-display-images.json';

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  cropToFit?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  cropToFit: false,
};

/**
 * Compress and convert an image file to WebP format using Canvas API.
 * Reduces file size by 80-90% for typical photos (4MB → 200-400KB).
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const { maxWidth, maxHeight, quality, cropToFit } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Skip non-image files
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropToFit ? maxWidth : width;
      canvas.height = cropToFit ? maxHeight : height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      if (cropToFit) {
        const ratio = maxWidth / maxHeight;
        const sourceWidth = Math.min(img.width, img.height * ratio);
        const sourceHeight = sourceWidth / ratio;
        ctx.drawImage(img, (img.width - sourceWidth) / 2, (img.height - sourceHeight) / 2,
          sourceWidth, sourceHeight, 0, 0, maxWidth, maxHeight);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create new file with .webp extension
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
          });

          console.log(
            `Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% savings)`
          );

          resolve(compressedFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If we can't process it, return original
      resolve(file);
    };

    img.src = url;
  });
};

/** Use prepared card assets without invoking a metered image service. */
export const getOptimizedImageUrl = (
  url: string,
  width = 400,
  height = 300,
  quality = 70,
  options: { cropToFit?: boolean } = {}
): string => {
  if (!url || typeof url !== "string") return url;
  if (url.includes('/storage/v1/render/image/public/')) {
    url = url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0];
  }
  if (options.cropToFit && width <= 400 && height <= 300) {
    const local = (serviceThumbnails as Record<string, string>)[url];
    if (typeof local === "string") return local;
    if (url.includes('/storage/v1/object/public/') && /\/fixup-v2-[0-9]+-[a-z0-9]+\.webp$/.test(url)) {
      return url.replace(/\.webp$/, '-card.webp');
    }
  }
  if (!options.cropToFit && width <= 1000 && height <= 1000) {
    const local = (serviceDisplayImages as Record<string, string>)[url];
    if (local) return local;
  }
  // Unprepared originals stay usable. Never turn these into render/image
  // requests: that service has exceeded this project's capped quota.
  return url;
};
