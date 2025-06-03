
import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Video } from "lucide-react";

interface VideoUploadProps {
  videos: string[];
  onVideosChange: (videos: string[]) => void;
  mechanicId: string;
  maxVideos?: number;
  bucketName?: string;
}

const VideoUpload = ({ 
  videos, 
  onVideosChange, 
  mechanicId, 
  maxVideos = 3,
  bucketName = "service-videos"
}: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = async (file: File) => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${mechanicId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('Uploading video to bucket:', bucketName, 'file:', fileName);
      
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

      const newVideoUrl = urlData.publicUrl;
      console.log('Video uploaded successfully:', newVideoUrl);
      
      onVideosChange([...videos, newVideoUrl]);
      toast.success("ვიდეო წარმატებით აიტვირთა");
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast.error(`ვიდეოს ატვირთვისას შეცდომა: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (videos.length + files.length > maxVideos) {
      toast.error(`მაქსიმუმ ${maxVideos} ვიდეოს შეგიძლიათ ატვირთოთ`);
      return;
    }

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error('მხოლოდ ვიდეო ფაილების ატვირთვაა შესაძლებელი');
        continue;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('ვიდეო ფაილის ზომა არ უნდა აღემატებოდეს 50MB-ს');
        continue;
      }

      await uploadVideo(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeVideo = async (videoUrl: string) => {
    try {
      // Extract filename from URL to delete from storage
      const urlParts = videoUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Get the last two parts (mechanicId/filename)
      
      console.log('Deleting from bucket:', bucketName, 'file:', fileName);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        // Don't throw error, just log it - remove from UI anyway
      }

      onVideosChange(videos.filter(video => video !== videoUrl));
      toast.success("ვიდეო წაიშალა");
    } catch (error: any) {
      console.error('Error removing video:', error);
      // Remove from UI even if storage deletion fails
      onVideosChange(videos.filter(video => video !== videoUrl));
      toast.error(`ვიდეოს წაშლისას შეცდომა: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base flex items-center gap-1">
          <Video size={16} />
          ვიდეოები
        </Label>
        <span className="text-sm text-muted-foreground">
          {videos.length}/{maxVideos}
        </span>
      </div>
      
      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video, index) => (
            <div key={index} className="relative group">
              <video
                src={video}
                className="w-full h-32 object-cover rounded-lg border border-primary/20"
                controls
                preload="metadata"
                onError={(e) => {
                  console.error('Video failed to load:', video);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeVideo(video)}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Button */}
      {videos.length < maxVideos && (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
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
                ვიდეოების ატვირთვა
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            მაქსიმუმ {maxVideos} ვიდეო, თითოეული 50MB-მდე
          </p>
          <p className="text-xs text-muted-foreground">
            მხარდაჭერილი ფორმატები: MP4, WebM, AVI, MOV
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
