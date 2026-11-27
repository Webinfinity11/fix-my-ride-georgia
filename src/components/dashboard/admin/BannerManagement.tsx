import { useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BannerUpload from "@/components/forms/BannerUpload";
import { useSiteBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, type SiteBanner } from "@/hooks/useSiteBanners";
import { BannerReport } from "./BannerReport";

const BannerManagement = () => {
  const [selectedBanner, setSelectedBanner] = useState<SiteBanner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    position: 'home_center_desktop' as 'home_center_desktop' | 'home_above_mobile_nav' | 'services_page',
    banner_url: '',
    link_url: '',
    is_active: true,
    display_order: 0,
  });

  const { data: banners = [], isLoading } = useSiteBanners();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();


  const handleAdd = () => {
    setSelectedBanner(null);
    setFormData({
      position: 'home_center_desktop',
      banner_url: '',
      link_url: '',
      is_active: true,
      display_order: 0,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (banner: SiteBanner) => {
    setSelectedBanner(banner);
    setFormData({
      position: banner.position,
      banner_url: banner.banner_url,
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    await deleteMutation.mutateAsync(bannerToDelete);
    setDeleteDialogOpen(false);
    setBannerToDelete(null);
  };

  const handleSubmit = async () => {
    if (!formData.banner_url) {
      return;
    }

    if (selectedBanner) {
      await updateMutation.mutateAsync({
        id: selectedBanner.id,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }

    setIsFormOpen(false);
    setSelectedBanner(null);
  };

  const getPositionLabel = (position: string) => {
    if (position === 'home_center_desktop') return '🖥️ Desktop - ცენტრალური';
    if (position === 'services_page') return '📄 სერვისების გვერდი';
    return '📱 Mobile - ნავიგაციის ზემოთ';
  };

  if (isLoading) {
    return <div className="p-6">იტვირთება...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">სარეკლამო ბანერების მართვა</h2>
          <p className="text-sm text-muted-foreground mt-1">
            დაამატეთ და მართეთ საიტზე გამოსაჩენი რეკლამები
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          ბანერის დამატება
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant={banner.is_active ? "default" : "secondary"}>
                    {banner.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {banner.is_active ? 'აქტიური' : 'გამორთული'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {getPositionLabel(banner.position)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={banner.banner_url}
                alt="Banner preview"
                className="w-full h-auto rounded-lg border"
                style={{ maxHeight: '120px', objectFit: 'contain' }}
              />
              {banner.link_url && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  🔗 {banner.link_url}
                </p>
              )}
              <BannerReport bannerId={banner.id} label={getPositionLabel(banner.position)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">ბანერები არ მოიძებნა</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              პირველი ბანერის დამატება
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBanner ? 'ბანერის რედაქტირება' : 'ახალი ბანერის დამატება'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>პოზიცია</Label>
              <Select 
                value={formData.position} 
                onValueChange={(value: any) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_center_desktop">
                    🖥️ Desktop - ცენტრალური (760x90px)
                  </SelectItem>
                  <SelectItem value="home_above_mobile_nav">
                    📱 Mobile - ნავიგაციის ზემოთ
                  </SelectItem>
                  <SelectItem value="services_page">
                    📄 სერვისების გვერდი (760x90px)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ბანერის სურათი</Label>
              <BannerUpload
                bannerUrl={formData.banner_url || null}
                onBannerChange={(url) => setFormData({ ...formData, banner_url: url || '' })}
                bucketName="fuel-importer-logos"
              />
            </div>

            <div className="space-y-2">
              <Label>ბმული (optional)</Label>
              <Input
                placeholder="https://example.com"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                თუ შეიყვანთ ბმულს, ბანერზე დაჭერისას გადავა ამ გვერდზე
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">აქტიური</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>თანმიმდევრობა (რიგი)</Label>
              <Input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                გაუქმება
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.banner_url}>
                {selectedBanner ? 'შენახვა' : 'დამატება'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ბანერი სამუდამოდ წაიშლება. ეს მოქმედება შეუქცევადია.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannerManagement;
