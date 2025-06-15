
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageCircle, Users, BarChart3 } from "lucide-react";
import { ChatRoomList } from './chat/ChatRoomList';
import { ChatParticipantsList } from './chat/ChatParticipantsList';
import { ChatRoomForm } from './chat/ChatRoomForm';
import { ChatStats } from './chat/ChatStats';
import { useChatManagement } from './chat/useChatManagement';

interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'channel';
  description?: string | null;
  is_public: boolean;
  created_at: string;
  created_by?: string;
  participant_count?: number;
  message_count?: number;
}

const ChatManagement = () => {
  const {
    rooms,
    participants,
    loading,
    participantsLoading,
    selectedRoomId,
    createRoom,
    updateRoom,
    deleteRoom,
    resetRoom,
    selectRoom,
    getStats
  } = useChatManagement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "channel" as "direct" | "channel",
    is_public: true
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "channel",
      is_public: true
    });
    setEditingRoom(null);
    setDialogOpen(false);
  };

  const openEditDialog = (room: ChatRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || "",
      description: room.description || "",
      type: room.type,
      is_public: room.is_public
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setFormSubmitting(true);
    
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData);
      } else {
        await createRoom(formData);
      }
      resetForm();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setFormSubmitting(false);
    }
  };

  const stats = getStats();
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          ჩატების მართვა
        </h3>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          ახალი ჩატი
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            მიმოხილვა
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            ჩატები
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            მონაწილეები
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ChatStats
            totalRooms={stats.totalRooms}
            totalChannels={stats.totalChannels}
            totalDirectChats={stats.totalDirectChats}
            totalMessages={stats.totalMessages}
            totalParticipants={stats.totalParticipants}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="rooms">
          <ChatRoomList
            rooms={rooms}
            onEditRoom={openEditDialog}
            onDeleteRoom={deleteRoom}
            onResetRoom={resetRoom}
            onSelectRoom={selectRoom}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="participants">
          <ChatParticipantsList
            participants={participants}
            selectedRoomName={selectedRoom?.name || undefined}
            loading={participantsLoading}
          />
        </TabsContent>
      </Tabs>

      <ChatRoomForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRoom={editingRoom}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        loading={formSubmitting}
      />
    </div>
  );
};

export default ChatManagement;
