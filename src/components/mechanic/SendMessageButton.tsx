
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const { createDirectChat, setActiveRoom, loadRooms } = useChat();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    console.log('Send message button clicked', { mechanicId, mechanicName, user: user?.id });

    if (!user) {
      toast.error("მესიჯის გასაგზავნად საჭიროა ავტორიზაცია");
      navigate('/login');
      return;
    }

    if (user.id === mechanicId) {
      toast.error("საკუთარ თავთან მესიჯის გაგზავნა არ შეიძლება");
      return;
    }

    try {
      console.log('Creating direct chat...');
      const roomId = await createDirectChat(mechanicId);
      
      console.log('Direct chat created, room ID:', roomId);
      
      // Set the active room
      setActiveRoom({
        id: roomId,
        name: `პირადი ჩატი - ${mechanicName}`,
        type: 'direct',
        is_public: false
      });

      // Navigate to chat page
      navigate('/chat');
      toast.success(`${mechanicName}-თან ჩატი გაიხსნა`);
      
    } catch (error) {
      console.error('Error creating direct chat:', error);
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
