
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ChatStats } from "./ChatStats";
import { ChatRoomList } from "./ChatRoomList";
import { ChatParticipantsList } from "./ChatParticipantsList";
import { ChatRoomForm } from "./ChatRoomForm";
import { useChatManagement } from "./useChatManagement";
import { PlusCircle, Users, MessageCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatDashboard: React.FC = () => {
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
    getStats,
  } = useChatManagement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "channel" as "channel" | "direct",
    is_public: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ name: "", description: "", type: "channel", is_public: true });
    setEditingRoom(null);
    setDialogOpen(false);
  };

  const openEditDialog = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || "",
      description: room.description || "",
      type: room.type,
      is_public: room.is_public,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData);
      } else {
        await createRoom(formData);
      }
      resetForm();
    } catch (error) {
      // handled in hook
    } finally {
      setFormSubmitting(false);
    }
  };

  const stats = getStats();
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="lg:grid lg:grid-cols-6 gap-6 space-y-6 lg:space-y-0">
      <div className="lg:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" /> ჩატების მართვა
          </h2>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            ახალი ჩატი
          </Button>
        </div>
        <Tabs defaultValue="rooms">
          <TabsList className="mb-4 grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="rooms" className="flex gap-2 items-center">
              <MessageCircle className="h-4 w-4" /> ჩატები
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex gap-2 items-center">
              <Users className="h-4 w-4" /> მონაწილეები
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex gap-2 items-center">
              <BarChart3 className="h-4 w-4" /> სტატისტიკა
            </TabsTrigger>
          </TabsList>

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
              selectedRoomName={selectedRoom?.name}
              loading={participantsLoading}
            />
          </TabsContent>
          <TabsContent value="stats">
            <ChatStats
              totalRooms={stats.totalRooms}
              totalChannels={stats.totalChannels}
              totalDirectChats={stats.totalDirectChats}
              totalMessages={stats.totalMessages}
              totalParticipants={stats.totalParticipants}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
      {/* გვერდით სტატისტიკის გრაფა */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ჩატის სტატისტიკა</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatStats
              totalRooms={stats.totalRooms}
              totalChannels={stats.totalChannels}
              totalDirectChats={stats.totalDirectChats}
              totalMessages={stats.totalMessages}
              totalParticipants={stats.totalParticipants}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
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
export default ChatDashboard;
