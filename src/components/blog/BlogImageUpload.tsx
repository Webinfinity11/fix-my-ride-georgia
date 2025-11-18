import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BlogImageUploadProps {
  currentImage: string;
  onImageUploaded: (url: string) => void;
}

export const BlogImageUpload = ({ currentImage, onImageUploaded }: BlogImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს');
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      toast.success('სურათი აიტვირთა');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('სურათის ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (currentImage) {
      try {
        const fileName = currentImage.split('/').pop();
        if (fileName) {
          await supabase.storage.from('blog-images').remove([fileName]);
        }
        onImageUploaded('');
        toast.success('სურათი წაიშალა');
      } catch (error) {
        console.error('Error removing image:', error);
        toast.error('სურათის წაშლა ვერ მოხერხდა');
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label>მთავარი სურათი</Label>
      
      {currentImage ? (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Featured"
            className="max-w-full h-auto rounded-lg max-h-64 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'იტვირთება...' : 'სურათის ატვირთვა'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            მაქს. 5MB (JPEG, PNG, WebP, GIF)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};
