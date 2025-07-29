
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { toast } from 'sonner';

export const JoinChannelsButton = () => {
  const { user } = useAuth();
  const { joinChannel, loadRooms } = useChat();

  const createDemoChannels = async () => {
    if (!user) {
      toast.error("ავტორიზაცია საჭიროა");
      return;
    }

    try {
      // Create demo car community channels
      const demoChannels = [
        {
          name: "Honda Fit Club",
          description: "Honda Fit მფლობელთა თემი",
          type: "channel",
          is_public: true
        },
        {
          name: "BMW Owners Georgia",
          description: "BMW მფლობელთა ქართული თემი",
          type: "channel", 
          is_public: true
        },
        {
          name: "Toyota Prius Club",
          description: "Toyota Prius ჰიბრიდული მანქანების თემი",
          type: "channel",
          is_public: true
        },
        {
          name: "Mechanic Tips & Tricks",
          description: "ხელოსნების რჩევები და გამოცდილება",
          type: "channel",
          is_public: true
        },
        {
          name: "Auto Parts Exchange",
          description: "ავტონაწილების გაცვლა-გაყიდვა",
          type: "channel",
          is_public: true
        }
      ];

      // Check which channels already exist
      const { data: existingChannels } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('type', 'channel');

      const existingNames = existingChannels?.map(c => c.name) || [];
      const channelsToCreate = demoChannels.filter(c => !existingNames.includes(c.name));

      if (channelsToCreate.length === 0) {
        toast.info("ყველა დემო არხი უკვე შექმნილია");
        return;
      }

      // Create new channels
      for (const channel of channelsToCreate) {
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert({
            name: channel.name,
            description: channel.description,
            type: channel.type,
            is_public: channel.is_public,
            created_by: user.id
          })
          .select()
          .single();

        if (newRoom && !error) {
          // Auto-join the creator
          await supabase
            .from('chat_participants')
            .insert({
              room_id: newRoom.id,
              user_id: user.id
            });

          // Add some demo messages
          await supabase
            .from('messages')
            .insert({
              room_id: newRoom.id,
              sender_id: user.id,
              content: `მოგესალმებით ${channel.name}-ში! 🚗`
            });
        }
      }

      toast.success(`${channelsToCreate.length} ახალი არხი შეიქმნა`);
      if (loadRooms) loadRooms();
      
    } catch (error) {
      console.error('Error creating demo channels:', error);
      toast.error("არხების შექმნისას შეცდომა დაფიქსირდა");
    }
  };

  const joinAllChannels = async () => {
    if (!user) {
      toast.error("ავტორიზაცია საჭიროა");
      return;
    }

    try {
      // Get all public channels
      const { data: channels } = await supabase
        .from('chat_rooms')
        .select('id, name')
        .eq('type', 'channel')
        .eq('is_public', true);

      if (!channels || channels.length === 0) {
        toast.info("საჯარო არხები ვერ მოიძებნა");
        return;
      }

      // Get channels user is not already in
      const { data: userChannels } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

      const userChannelIds = userChannels?.map(uc => uc.room_id) || [];
      const channelsToJoin = channels.filter(c => !userChannelIds.includes(c.id));

      if (channelsToJoin.length === 0) {
        toast.info("ყველა არხში უკვე ხართ");
        return;
      }

      // Join all channels
      for (const channel of channelsToJoin) {
        await joinChannel(channel.id);
      }

      toast.success(`${channelsToJoin.length} არხში შეუერთდით`);
      
    } catch (error) {
      console.error('Error joining channels:', error);
      toast.error("არხებში შესვლისას შეცდომა დაფიქსირდა");
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={createDemoChannels}
        variant="outline" 
        size="sm" 
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        დემო არხების შექმნა
      </Button>
      
      <Button 
        onClick={joinAllChannels}
        variant="default" 
        size="sm" 
        className="w-full"
      >
        <Users className="h-4 w-4 mr-2" />
        ყველა არხში შესვლა
      </Button>
    </div>
  );
};
