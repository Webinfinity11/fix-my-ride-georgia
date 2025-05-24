import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  mechanicId: string;
  maxPhotos?: number;
  bucketName?: string;
}

const PhotoUpload = ({ 
  photos, 
  onPhotosChange, 
  mechanicId, 
  maxPhotos = 5,
  bucketName = "service-photos"
}: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${mechanicId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('Uploading to bucket:', bucketName, 'file:', fileName);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const newPhotoUrl = urlData.publicUrl;
      console.log('Photo uploaded successfully:', newPhotoUrl);
      
      onPhotosChange([...photos, newPhotoUrl]);
      toast.success("ფოტო წარმატებით აიტვირთა");
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(`ფოტოს ატვირთვისას შეცდომა: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`მაქსიმუმ ${maxPhotos} ფოტოს შეგიძლიათ ატვირთოთ`);
      return;
    }

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('მხოლოდ სურათების ატვირთვაა შესაძლებელი');
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს');
        continue;
      }

      await uploadPhoto(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      // Extract filename from URL to delete from storage
      const urlParts = photoUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Get the last two parts (mechanicId/filename)
      
      console.log('Deleting from bucket:', bucketName, 'file:', fileName);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        // Don't throw error, just log it - remove from UI anyway
      }

      onPhotosChange(photos.filter(photo => photo !== photoUrl));
      toast.success("ფოტო წაიშალა");
    } catch (error: any) {
      console.error('Error removing photo:', error);
      // Remove from UI even if storage deletion fails
      onPhotosChange(photos.filter(photo => photo !== photoUrl));
      toast.error(`ფოტოს წაშლისას შეცდომა: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">ფოტოები</Label>
        <span className="text-sm text-muted-foreground">
          {photos.length}/{maxPhotos}
        </span>
      </div>
      
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`ფოტო ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-primary/20"
                onError={(e) => {
                  console.error('Image failed to load:', photo);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(photo)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="border-primary/30 hover:bg-primary/5"
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                ატვირთვა...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                ფოტოების ატვირთვა
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            მაქსიმუმ {maxPhotos} ფოტო, თითოეული 5MB-მდე
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
