import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

interface BannerUploadProps {
  bannerUrl: string | null;
  onBannerChange: (url: string | null) => void;
  bucketName?: string;
}

const BannerUpload = ({ 
  bannerUrl, 
  onBannerChange,
  bucketName = "fuel-importer-logos"
}: BannerUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBanner = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `banners/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const newBannerUrl = urlData.publicUrl;
      onBannerChange(newBannerUrl);
      toast.success("ბანერი წარმატებით აიტვირთა");
      
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error(`ბანერის ატვირთვისას შეცდომა: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('მხოლოდ სურათების ატვირთვაა შესაძლებელი');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს');
      return;
    }

    await uploadBanner(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeBanner = async () => {
    if (!bannerUrl) return;

    try {
      const urlParts = bannerUrl.split('/');
      const fileName = urlParts.slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
      }

      onBannerChange(null);
      toast.success("ბანერი წაიშალა");
    } catch (error: any) {
      console.error('Error removing banner:', error);
      onBannerChange(null);
      toast.error(`ბანერის წაშლისას შეცდომა: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {bannerUrl && (
        <div className="relative group">
          <img
            src={bannerUrl}
            alt="Banner"
            className="w-full h-48 object-cover rounded-lg border border-primary/20"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeBanner}
          >
            <X size={16} />
          </Button>
        </div>
      )}
      
      <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
              ბანერის ატვირთვა
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          რეკომენდებული ზომა: 1920x400px, მაქსიმუმ 5MB
        </p>
      </div>
    </div>
  );
};

export default BannerUpload;
