
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Hash, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { toast } from 'sonner';

export const JoinChannelsButton = () => {
  const { user } = useAuth();
  const { createChannel, loadRooms } = useChat();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
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

    setIsCreatingDemo(true);

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
        try {
          const result = await createChannel(channel.name, channel.description, true);
          if (result) {
            createdCount++;
          }
        } catch (error) {
          console.error(`Error creating channel ${channel.name}:`, error);
        }
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} ახალი არხი შეიქმნა`);
      } else {
        toast.info("ყველა დემო არხი უკვე შექმნილია ან შექმნისას პრობლემა აღმოჩნდა");
      }
      
    } catch (error) {
      console.error('Error creating demo channels:', error);
      toast.error("არხების შექმნისას შეცდომა დაფიქსირდა");
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelForm.name.trim()) {
      toast.error("არხის სახელი აუცილებელია");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createChannel(
        channelForm.name.trim(),
        channelForm.description.trim() || undefined,
        channelForm.isPublic
      );

      if (result) {
        setChannelForm({ name: '', description: '', isPublic: true });
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsCreating(false);
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
                disabled={isCreating}
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
                disabled={isCreating}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="channel-public"
                checked={channelForm.isPublic}
                onChange={(e) => setChannelForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                disabled={isCreating}
              />
              <Label htmlFor="channel-public">საჯარო არხი</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    იქმნება...
                  </>
                ) : (
                  <>
                    <Hash className="h-4 w-4 mr-2" />
                    შექმნა
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                გაუქმება
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};
