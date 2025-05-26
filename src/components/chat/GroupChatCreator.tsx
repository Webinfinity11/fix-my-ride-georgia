
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { toast } from 'sonner';

export const GroupChatCreator = () => {
  const { user } = useAuth();
  const { loadRooms } = useChat();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.name.trim()) {
      toast.error("ჯგუფის სახელი სავალდებულოა");
      return;
    }

    setLoading(true);
    console.log('Creating group chat:', formData.name);
    
    try {
      // Create new group chat
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          type: 'channel',
          is_public: true,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('Room creation error:', roomError);
        toast.error(`ჯგუფის შექმნისას შეცდომა: ${roomError.message}`);
        return;
      }

      console.log('Room created successfully:', newRoom);

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: newRoom.id,
          user_id: user.id
        });

      if (participantError) {
        console.error('Participant error:', participantError);
        toast.error('ჯგუფში შესვლისას შეცდომა');
        return;
      }

      // Add welcome message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          room_id: newRoom.id,
          sender_id: user.id,
          content: `მოგესალმებით ${formData.name}-ში! 🚗`
        });

      if (messageError) {
        console.error('Welcome message error:', messageError);
        // Don't fail the whole process for this
      }

      toast.success(`ჯგუფი "${formData.name}" შეიქმნა`);
      setFormData({ name: '', description: '' });
      setOpen(false);
      await loadRooms();
      
    } catch (error) {
      console.error('Unexpected error creating group:', error);
      toast.error("ჯგუფის შექმნისას მოულოდნელი შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          ახალი ჯგუფი
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ახალი ჯგუფის შექმნა
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ჯგუფის სახელი *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="მაგ: BMW Owners Club"
              required
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="ჯგუფის მოკლე აღწერა..."
              rows={3}
              maxLength={200}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()} className="flex-1">
              {loading ? "მიმდინარეობს..." : "შექმნა"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
