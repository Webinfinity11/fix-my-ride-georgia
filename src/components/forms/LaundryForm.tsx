import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SimpleMapLocationPicker from "@/components/forms/SimpleMapLocationPicker";
import PhotoUpload from "@/components/forms/PhotoUpload";
import VideoUpload from "@/components/forms/VideoUpload";
import { useCreateLaundry, useUpdateLaundry } from "@/hooks/useLaundries";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Laundry = Database["public"]["Tables"]["laundries"]["Row"];

const laundrySchema = z.object({
  name: z.string().min(1, "სახელი აუცილებელია"),
  description: z.string().optional(),
  contact_number: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().min(-180).max(180, "გრძედი აუცილებელია"),
  water_price: z.number().min(0).optional(),
  foam_price: z.number().min(0).optional(),
  wax_price: z.number().min(0).optional(),
  box_count: z.number().min(0).optional(),
});

type LaundryFormData = z.infer<typeof laundrySchema>;

interface LaundryFormProps {
  laundry?: Laundry | null;
  onSuccess?: () => void;
}

const LaundryForm = ({ laundry, onSuccess }: LaundryFormProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(laundry?.photos || []);
  const [videos, setVideos] = useState<string[]>(laundry?.videos || []);
  
  const createLaundry = useCreateLaundry();
  const updateLaundry = useUpdateLaundry();

  const form = useForm<LaundryFormData>({
    resolver: zodResolver(laundrySchema),
    defaultValues: {
      name: laundry?.name || "",
      description: laundry?.description || "",
      contact_number: laundry?.contact_number || "",
      address: laundry?.address || "",
      latitude: laundry?.latitude ? Number(laundry.latitude) : undefined,
      longitude: laundry?.longitude ? Number(laundry.longitude) : 44.7862, // Default Tbilisi longitude
      water_price: laundry?.water_price ? Number(laundry.water_price) : undefined,
      foam_price: laundry?.foam_price ? Number(laundry.foam_price) : undefined,
      wax_price: laundry?.wax_price ? Number(laundry.wax_price) : undefined,
      box_count: laundry?.box_count || undefined,
    },
  });

  const onSubmit = async (data: LaundryFormData) => {
    if (!user) return;

    // Ensure required fields are provided
    if (!data.longitude) {
      form.setError("longitude", { message: "მდებარეობა აუცილებელია" });
      return;
    }

    if (!data.name) {
      form.setError("name", { message: "სახელი აუცილებელია" });
      return;
    }

    const laundryData = {
      name: data.name,
      description: data.description || "",
      contact_number: data.contact_number || "",
      address: data.address || "",
      latitude: data.latitude,
      longitude: data.longitude,
      water_price: data.water_price,
      foam_price: data.foam_price,
      wax_price: data.wax_price,
      box_count: data.box_count,
      photos,
      videos,
      created_by: user.id,
    };

    try {
      if (laundry) {
        await updateLaundry.mutateAsync({ id: laundry.id, ...laundryData });
      } else {
        await createLaundry.mutateAsync(laundryData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving laundry:", error);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>სახელი *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="სამრეცხაოს სახელი" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>აღწერა</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="სამრეცხაოს აღწერა" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>საკონტაქტო ნომერი</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ტელეფონის ნომერი" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>მისამართი</FormLabel>
              <FormControl>
                <Input {...field} placeholder="სამრეცხაოს მისამართი" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temporarily disabled map to isolate render2 error */}
        <div className="space-y-2">
          <Label>მდებარეობა რუკაზე *</Label>
          <div className="h-64 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <p className="text-muted-foreground">რუკა დროებით გათიშულია</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="water_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>წყლის ფასი (₾)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="foam_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ქაფის ფასი (₾)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wax_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ცვილის ფასი (₾)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="box_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ბოქსების რაოდენობა</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min="0"
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            mechanicId={user?.id || ""}
            bucketName="service-photos"
            maxPhotos={10}
          />

          <VideoUpload
            videos={videos}
            onVideosChange={setVideos}
            mechanicId={user?.id || ""}
            bucketName="service-videos"
            maxVideos={5}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={createLaundry.isPending || updateLaundry.isPending}
          >
            {createLaundry.isPending || updateLaundry.isPending ? "შენახვა..." : "შენახვა"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LaundryForm;