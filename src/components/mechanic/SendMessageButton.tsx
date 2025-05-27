
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
  const { createDirectChat, setActiveRoom } = useChat();
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
      const room = await createDirectChat(mechanicId);
      console.log('📦 Created room:', room);
      
      if (room) {
        console.log('🚀 Navigating to chat page');
        navigate('/chat');
        
        // პატარა დაყოვნება, რათა ჩატის გვერდი ჩაიტვირთოს
        setTimeout(() => {
          console.log('🎯 Setting active room:', room);
          setActiveRoom(room);
        }, 100);
        
        toast.success(`${mechanicName}-თან ჩატი გაიხსნა`);
      } else {
        console.log('❌ Room creation failed');
        toast.error("ჩატის შექმნა ვერ მოხერხდა");
      }
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
