import type { supabase } from '@/integrations/supabase/client';
type PhotoStorage = Pick<ReturnType<typeof supabase.storage.from>, 'upload' | 'remove'>;

export function photoStoragePaths(fileName: string): string[] {
  return /(?:^|\/)fixup-v2-[0-9]+-[a-z0-9]+\.webp$/.test(fileName)
    ? [fileName, fileName.replace(/\.webp$/, '-card.webp')]
    : [fileName];
}

export async function uploadPreparedServicePhoto(
  storage: PhotoStorage, fileName: string, gallery: File, card: File,
): Promise<void> {
  const options = { cacheControl: '31536000', upsert: false, contentType: 'image/webp' };
  const { error } = await storage.upload(fileName, gallery, options);
  if (error) throw error;
  const { error: cardError } = await storage.upload(fileName.replace(/\.webp$/, '-card.webp'), card, options);
  if (cardError) {
    // Neither file has been attached to a service yet. Clean up this attempt.
    await storage.remove(photoStoragePaths(fileName));
    throw cardError;
  }
}
