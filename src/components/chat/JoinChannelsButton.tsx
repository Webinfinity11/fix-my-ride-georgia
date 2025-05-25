
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export const JoinChannelsButton = () => {
  const { user } = useAuth();

  const joinAllChannels = async () => {
    if (!user) return;

    try {
      // ყველა ზოგადი არხის ID-ების მიღება
      const { data: channels } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('type', 'channel')
        .eq('is_public', true);

      if (channels) {
        // ყველა არხში შეერთება
        const participantInserts = channels.map(channel => ({
          room_id: channel.id,
          user_id: user.id
        }));

        const { error } = await supabase
          .from('chat_participants')
          .upsert(participantInserts, { 
            onConflict: 'room_id,user_id',
            ignoreDuplicates: true 
          });

        if (!error) {
          toast.success('წარმატებით შეუერთდით ყველა ზოგად არხს!');
          // ჩატების თავიდან ჩატვირთვა
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error joining channels:', error);
      toast.error('შეცდომა არხებში შეერთებისას');
    }
  };

  return (
    <Button 
      onClick={joinAllChannels}
      variant="outline" 
      size="sm"
      className="w-full mb-4"
    >
      <Plus className="h-4 w-4 mr-2" />
      ყველა არხში შეერთება
    </Button>
  );
};
