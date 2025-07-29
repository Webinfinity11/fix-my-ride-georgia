
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SendMessageButtonProps {
  mechanicId: string;
  mechanicName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const SendMessageButton: React.FC<SendMessageButtonProps> = ({ 
  mechanicId, 
  mechanicName = "ხელოსანი",
  variant = "default",
  size = "default",
  className = ""
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    console.log('🔘 SendMessageButton clicked');
    console.log('👤 Current user:', user);
    console.log('🔧 Target mechanic ID:', mechanicId);

    if (!user) {
      console.log('❌ No user authenticated');
      toast.error("მესიჯის გასაგზავნად საჭიროა ავტორიზაცია");
      navigate('/login');
      return;
    }

    if (user.id === mechanicId) {
      console.log('❌ User trying to chat with themselves');
      toast.error("საკუთარ თავთან მესიჯის გაგზავნა არ შეიძლება");
      return;
    }

    try {
      console.log('💬 Creating direct chat...');
      
      // Check for existing direct chat between these users
      const { data: existingChats } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          description,
          is_public,
          created_by,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct');

      let existingChatId = null;

      if (existingChats) {
        // Find a direct chat where both users are participants
        for (const chat of existingChats) {
          const participantIds = chat.chat_participants.map((p: any) => p.user_id);
          if (participantIds.includes(user.id) && participantIds.includes(mechanicId) && participantIds.length === 2) {
            console.log('✅ Found existing direct chat:', chat.id);
            existingChatId = chat.id;
            break;
          }
        }
      }

      if (!existingChatId) {
        // Create new direct chat
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            type: 'direct',
            is_public: false,
            created_by: user.id
          })
          .select()
          .single();

        if (createError || !newRoom) {
          console.error('❌ Error creating room:', createError);
          toast.error('ჩატის შექმნისას შეცდომა დაფიქსირდა');
          return;
        }

        // Add participants
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert([
            { room_id: newRoom.id, user_id: user.id },
            { room_id: newRoom.id, user_id: mechanicId }
          ]);

        if (participantsError) {
          console.error('❌ Error adding participants:', participantsError);
          toast.error('მონაწილეების დამატებისას შეცდომა დაფიქსირდა');
          return;
        }

        existingChatId = newRoom.id;
      }
      
      console.log('🚀 Navigating to chat page');
      // Navigate to chat page with the room ID as a query parameter
      navigate(`/chat?room=${existingChatId}`);
      toast.success(`${mechanicName}-თან ჩატი გაიხსნა`);
      
    } catch (error) {
      console.error('💥 Error creating direct chat:', error);
      toast.error("ჩატის გახსნისას შეცდომა დაფიქსირდა");
    }
  };

  return (
    <Button 
      onClick={handleSendMessage}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      <span>მიწერა</span>
    </Button>
  );
};
