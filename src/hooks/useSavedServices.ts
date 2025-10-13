import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useSavedServices = () => {
  const { user } = useAuth();
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedServices();
    } else {
      setSavedServiceIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchSavedServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_services')
        .select('service_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const ids = new Set(data.map(item => item.service_id));
      setSavedServiceIds(ids);
    } catch (error) {
      console.error('Error fetching saved services:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSaved = (serviceId: number) => {
    return savedServiceIds.has(serviceId);
  };

  const toggleSave = async (serviceId: number) => {
    if (!user) {
      toast.error('გთხოვთ გაიაროთ ავტორიზაცია', {
        description: 'სერვისის შესანახად საჭიროა ავტორიზაცია',
        action: {
          label: 'რეგისტრაცია',
          onClick: () => window.location.href = '/register',
        },
      });
      return false;
    }

    const saved = isSaved(serviceId);

    try {
      if (saved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_services')
          .delete()
          .eq('user_id', user.id)
          .eq('service_id', serviceId);

        if (error) throw error;

        setSavedServiceIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceId);
          return newSet;
        });

        toast.success('სერვისი წაიშალა შენახულებიდან');
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_services')
          .insert({
            user_id: user.id,
            service_id: serviceId,
          });

        if (error) throw error;

        setSavedServiceIds(prev => new Set(prev).add(serviceId));

        toast.success('სერვისი შენახულია');
      }

      return true;
    } catch (error: any) {
      console.error('Error toggling saved service:', error);
      toast.error('შეცდომა', {
        description: error.message || 'სერვისის შენახვისას დაფიქსირდა შეცდომა',
      });
      return false;
    }
  };

  return {
    isSaved,
    toggleSave,
    loading,
    savedServiceIds,
    refetch: fetchSavedServices,
  };
};
