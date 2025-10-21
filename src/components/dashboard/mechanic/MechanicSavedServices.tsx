import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Eye, Trash2, MapPin, Bookmark } from 'lucide-react';

interface SavedService {
  id: string;
  created_at: string;
  notes: string | null;
  service: {
    id: number;
    name: string;
    slug: string;
    city: string | null;
    district: string | null;
    price_from: number | null;
    price_to: number | null;
    photos: string[];
    mechanic_id: string;
  };
}

export const MechanicSavedServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedServices();
  }, [user]);

  const fetchSavedServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_services')
        .select(`
          id,
          created_at,
          notes,
          service:mechanic_services!saved_services_service_id_fkey (
            id,
            name,
            slug,
            city,
            district,
            price_from,
            price_to,
            photos,
            mechanic_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedServices(data || []);
    } catch (error: any) {
      console.error('Error fetching saved services:', error);
      toast.error('შეცდომა', {
        description: 'შენახული სერვისების ჩატვირთვისას დაფიქსირდა შეცდომა',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from('saved_services')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedServices((prev) => prev.filter((item) => item.id !== savedId));
      toast.success('სერვისი წაიშალა შენახულებიდან');
    } catch (error: any) {
      console.error('Error removing saved service:', error);
      toast.error('შეცდომა', {
        description: 'სერვისის წაშლისას დაფიქსირდა შეცდომა',
      });
    }
  };

  const handleViewService = (slug: string) => {
    navigate(`/services/${slug}`);
  };

  const formatPrice = (from: number | null, to: number | null) => {
    if (!from && !to) return 'ფასი არ არის მითითებული';
    if (from && to) return `${from} - ${to} ₾`;
    if (from) return `${from} ₾-დან`;
    if (to) return `${to} ₾-მდე`;
    return '';
  };

  const formatLocation = (city: string | null, district: string | null) => {
    if (!city && !district) return 'მდებარეობა არ არის მითითებული';
    if (city && district) return `${city}, ${district}`;
    return city || district || '';
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">შენახული სერვისები</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (savedServices.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">შენახული სერვისები არ გაქვთ</h2>
        <p className="text-muted-foreground mb-6">
          შეინახეთ სხვა ხელოსნების სერვისები იდეებისთვის და შედარებისთვის
        </p>
        <Button onClick={() => navigate('/services')}>
          სერვისების ნახვა
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">შენახული სერვისები</h1>
        <span className="text-sm text-muted-foreground">
          ({savedServices.length})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedServices.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-muted">
              {item.service.photos?.[0] ? (
                <img
                  src={item.service.photos[0]}
                  alt={item.service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bookmark className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {item.service.name}
              </h3>
              
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {formatLocation(item.service.city, item.service.district)}
                </span>
              </div>

              <div className="text-sm font-medium text-primary mb-4">
                {formatPrice(item.service.price_from, item.service.price_to)}
              </div>

              {item.notes && (
                <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
                  <p className="line-clamp-2">{item.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewService(item.service.slug)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  ნახვა
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
