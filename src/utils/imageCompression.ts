/**
 * Client-side image compression and WebP conversion utility.
 * Resizes images to a max dimension and converts to WebP format
 * before uploading to Supabase Storage.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
};

/**
 * Compress and convert an image file to WebP format using Canvas API.
 * Reduces file size by 80-90% for typical photos (4MB → 200-400KB).
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

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
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

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

/**
 * Helper to build optimized Supabase image URL using the render/image endpoint.
 * Converts existing stored images to WebP on the fly.
 */
export const getOptimizedImageUrl = (
  url: string,
  width = 400,
  height = 300,
  quality = 70
): string => {
  if (!url.includes('supabase.co')) return url;

  // Convert /object/public/ to /render/image/public/ for transformation support
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  return `${renderUrl}?width=${width}&height=${height}&quality=${quality}&resize=cover&format=webp`;
};
