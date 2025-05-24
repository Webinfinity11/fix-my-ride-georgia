
import { useState } from "react";
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
}

const PhotoUpload = ({ photos, onPhotosChange, mechanicId }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const filePath = `${mechanicId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('service-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('service-photos')
          .getPublicUrl(filePath);

        newPhotos.push(data.publicUrl);
      }

      onPhotosChange([...photos, ...newPhotos]);
      toast.success("ფოტოები წარმატებით აიტვირთა");
    } catch (error: any) {
      toast.error(`ფოტოების ატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">სერვისის ფოტოები</Label>
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6">
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                className="border-primary/30 hover:bg-primary/5"
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "იტვირთება..." : "ფოტოების ატვირთვა"}
                </span>
              </Button>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground mt-2">
              მაქსიმუმ 5MB თითოეული ფოტო. მხარდაჭერილი ფორმატები: JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`სერვისის ფოტო ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-primary/20"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
