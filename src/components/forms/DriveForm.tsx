import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PhotoUpload from "./PhotoUpload";
import VideoUpload from "./VideoUpload";
import LocationMapPicker from "./LocationMapPicker";
import type { Database } from "@/integrations/supabase/types";

type DriveInsert = Database["public"]["Tables"]["drives"]["Insert"];

interface DriveFormProps {
  onSubmit: (data: DriveInsert) => void;
  initialData?: Partial<DriveInsert>;
  isLoading?: boolean;
}

export const DriveForm = ({ onSubmit, initialData, isLoading }: DriveFormProps) => {
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [videos, setVideos] = useState<string[]>(initialData?.videos || []);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData?.latitude && initialData?.longitude
      ? { lat: Number(initialData.latitude), lng: Number(initialData.longitude) }
      : null
  );

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      description: initialData?.description || "",
      contact_number: initialData?.contact_number || "",
    },
  });

  const handleFormSubmit = (data: any) => {
    if (!location) {
      alert("გთხოვთ აირჩიოთ ლოკაცია რუკაზე");
      return;
    }

    onSubmit({
      ...data,
      latitude: location.lat,
      longitude: location.lng,
      photos,
      videos,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">დასახელება *</Label>
        <Input
          id="name"
          {...register("name", { required: "დასახელება აუცილებელია" })}
          placeholder="მაგ: ავტოდრაივი თბილისი"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">მისამართი</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="მაგ: თბილისი, ვაკე"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_number">საკონტაქტო ნომერი</Label>
        <Input
          id="contact_number"
          {...register("contact_number")}
          placeholder="მაგ: +995 XXX XXX XXX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">აღწერა</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="დრაივის დეტალური აღწერა..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>ლოკაცია რუკაზე *</Label>
        <LocationMapPicker
          latitude={location?.lat}
          longitude={location?.lng}
          onLocationChange={handleLocationChange}
          interactive={true}
        />
      </div>

      <div className="space-y-2">
        <Label>ფოტოები</Label>
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
          mechanicId="drives"
          bucketName="service-photos"
        />
      </div>

      <div className="space-y-2">
        <Label>ვიდეოები</Label>
        <VideoUpload
          videos={videos}
          onVideosChange={setVideos}
          mechanicId="drives"
          bucketName="service-videos"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "იტვირთება..." : initialData ? "განახლება" : "დამატება"}
      </Button>
    </form>
  );
};
