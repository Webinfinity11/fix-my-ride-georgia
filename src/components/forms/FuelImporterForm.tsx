import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateFuelImporter, useUpdateFuelImporter } from "@/hooks/useFuelImporters";
import PhotoUpload from "./PhotoUpload";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type FuelImporter = Database["public"]["Tables"]["fuel_importers"]["Row"];

const formSchema = z.object({
  name: z.string().min(1, "კომპანიის სახელი სავალდებულოა"),
  super_ron_98_price: z.string().optional(),
  premium_ron_96_price: z.string().optional(),
  regular_ron_93_price: z.string().optional(),
});

interface FuelImporterFormProps {
  importer?: FuelImporter | null;
  onSuccess?: () => void;
}

const FuelImporterForm = ({ importer, onSuccess }: FuelImporterFormProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(importer?.logo_url ? [importer.logo_url] : []);
  const createMutation = useCreateFuelImporter();
  const updateMutation = useUpdateFuelImporter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: importer?.name || "",
      super_ron_98_price: importer?.super_ron_98_price?.toString() || "",
      premium_ron_96_price: importer?.premium_ron_96_price?.toString() || "",
      regular_ron_93_price: importer?.regular_ron_93_price?.toString() || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const importerData = {
        name: values.name,
        logo_url: photos[0] || null,
        super_ron_98_price: values.super_ron_98_price ? parseFloat(values.super_ron_98_price) : null,
        premium_ron_96_price: values.premium_ron_96_price ? parseFloat(values.premium_ron_96_price) : null,
        regular_ron_93_price: values.regular_ron_93_price ? parseFloat(values.regular_ron_93_price) : null,
      };

      if (importer) {
        await updateMutation.mutateAsync({ id: importer.id, ...importerData });
      } else {
        await createMutation.mutateAsync(importerData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error("Error saving fuel importer:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>კომპანიის ლოგო</FormLabel>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            mechanicId={user?.id || "fuel-importer"}
            bucketName="fuel-importer-logos"
            maxPhotos={1}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>კომპანიის სახელი *</FormLabel>
              <FormControl>
                <Input placeholder="მაგ: Rompetrol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="super_ron_98_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სუპერი RON 98 (₾)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="მაგ: 3.25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="premium_ron_96_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>პრემიუმი RON 96 (₾)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="მაგ: 3.15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regular_ron_93_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>რეგულარი RON 93 (₾)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="მაგ: 3.05" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {importer ? "განახლება" : "დამატება"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FuelImporterForm;
