
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { toast } from 'sonner';

export const JoinChannelsButton = () => {
  const { user } = useAuth();
  const { joinChannel, loadRooms, createChannel } = useChat();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  const createDemoChannels = async () => {
    if (!user) {
      toast.error("ავტორიზაცია საჭიროა");
      return;
    }

    try {
      const demoChannels = [
        {
          name: "Honda Fit Club",
          description: "Honda Fit მფლობელთა თემი"
        },
        {
          name: "BMW Owners Georgia", 
          description: "BMW მფლობელთა ქართული თემი"
        },
        {
          name: "Toyota Prius Club",
          description: "Toyota Prius ჰიბრიდული მანქანების თემი"
        },
        {
          name: "Mechanic Tips & Tricks",
          description: "ხელოსნების რჩევები და გამოცდილება"
        },
        {
          name: "Auto Parts Exchange",
          description: "ავტონაწილების გაცვლა-გაყიდვა"
        }
      ];

      let createdCount = 0;
      for (const channel of demoChannels) {
        const result = await createChannel(channel.name, channel.description, true);
        if (result) {
          createdCount++;
        }
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} ახალი არხი შეიქმნა`);
        await loadRooms();
      } else {
        toast.info("ყველა დემო არხი უკვე შექმნილია");
      }
      
    } catch (error) {
      console.error('Error creating demo channels:', error);
      toast.error("არხების შექმნისას შეცდომა დაფიქსირდა");
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelForm.name.trim()) {
      toast.error("არხის სახელი აუცილებელია");
      return;
    }

    try {
      const result = await createChannel(
        channelForm.name.trim(),
        channelForm.description.trim() || undefined,
        channelForm.isPublic
      );

      if (result) {
        toast.success("არხი წარმატებით შეიქმნა");
        setChannelForm({ name: '', description: '', isPublic: true });
        setIsCreateDialogOpen(false);
        await loadRooms();
      } else {
        toast.error("არხის შექმნისას შეცდომა დაფიქსირდა");
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error("არხის შექმნისას შეცდომა დაფიქსირდა");
    }
  };

  return (
    <div className="space-y-2">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            ახალი არხის შექმნა
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ახალი არხის შექმნა</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChannel} className="space-y-4">
            <div>
              <Label htmlFor="channel-name">არხის სახელი *</Label>
              <Input
                id="channel-name"
                value={channelForm.name}
                onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="მაგ. BMW Owners Georgia"
                required
              />
            </div>

            <div>
              <Label htmlFor="channel-description">აღწერა</Label>
              <Textarea
                id="channel-description"
                value={channelForm.description}
                onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="არხის მოკლე აღწერა..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="channel-public"
                checked={channelForm.isPublic}
                onChange={(e) => setChannelForm(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
              <Label htmlFor="channel-public">საჯარო არხი</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Hash className="h-4 w-4 mr-2" />
                შექმნა
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                გაუქმება
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Button 
        onClick={createDemoChannels}
        variant="outline" 
        size="sm" 
        className="w-full"
      >
        <Users className="h-4 w-4 mr-2" />
        დემო არხების შექმნა
      </Button>
    </div>
  );
};
