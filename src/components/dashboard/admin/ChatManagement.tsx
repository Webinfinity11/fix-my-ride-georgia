
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Edit, Trash2, Plus, RefreshCw, Hash, User, Settings } from "lucide-react";

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

interface ChatParticipant {
  id: string;
  user_id: string;
  room_id: string;
  joined_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ChatManagement = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "channel" as "direct" | "channel",
    is_public: true
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchParticipants(selectedRoomId);
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Get all rooms first
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      // For each room, get participant and message counts separately
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Get participant count
          const { count: participantCount } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          // Get message count
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return {
            id: room.id,
            name: room.name,
            type: (room.type === 'direct' || room.type === 'channel') ? room.type : 'channel',
            description: room.description,
            is_public: room.is_public ?? true,
            created_at: room.created_at,
            created_by: room.created_by,
            participant_count: participantCount || 0,
            message_count: messageCount || 0
          };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast.error('ჩატების ჩატვირთვისას შეცდომა დაფიქსირდა');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq('room_id', roomId);

      if (error) throw error;

      setParticipants(data?.map(p => ({
        ...p,
        profile: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      })) || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast.error('მონაწილეების ჩატვირთვისას შეცდომა დაფიქსირდა');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const roomData = {
        name: formData.name || null,
        description: formData.description || null,
        type: formData.type,
        is_public: formData.is_public
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('chat_rooms')
          .update(roomData)
          .eq('id', editingRoom.id);
        
        if (error) throw error;
        toast.success('ჩატი წარმატებით განახლდა');
      } else {
        const { error } = await supabase
          .from('chat_rooms')
          .insert([roomData]);
        
        if (error) throw error;
        toast.success('ჩატი წარმატებით შეიქმნა');
      }

      resetForm();
      fetchRooms();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('შეცდომა: ' + error.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      // Delete participants first
      await supabase.from('chat_participants').delete().eq('room_id', roomId);
      
      // Delete messages
      await supabase.from('messages').delete().eq('room_id', roomId);
      
      // Delete room
      const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId);
      
      if (error) throw error;
      
      toast.success('ჩატი წარმატებით წაიშალა');
      fetchRooms();
      setSelectedRoomId(null);
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('ჩატის წაშლისას შეცდომა დაფიქსირდა');
    }
  };

  const handleResetRoom = async (roomId: string) => {
    try {
      // Delete all messages in the room
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);
      
      if (error) throw error;
      
      toast.success('ჩატის ისტორია წარმატებით წაიშალა');
      fetchRooms();
    } catch (error: any) {
      console.error('Error resetting room:', error);
      toast.error('ჩატის რესეტისას შეცდომა დაფიქსირდა');
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          ჩატების მართვა
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              ახალი ჩატი
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? "ჩატის რედაქტირება" : "ახალი ჩატი"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">სახელი</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ჩატის სახელი"
                />
              </div>

              <div>
                <Label htmlFor="description">აღწერა</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ჩატის აღწერა"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">ტიპი</Label>
                <Select value={formData.type} onValueChange={(value: "direct" | "channel") => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">არხი</SelectItem>
                    <SelectItem value="direct">პირადი</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                />
                <Label htmlFor="is_public">საჯარო ჩატი</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingRoom ? "განახლება" : "შექმნა"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  გაუქმება
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms">ჩატები</TabsTrigger>
          <TabsTrigger value="participants">მონაწილეები</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>ყველა ჩატი</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {room.type === 'channel' ? (
                        <Hash className="h-5 w-5 text-gray-500" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {room.name || `${room.type === 'direct' ? 'პირადი ჩატი' : 'უსახელო არხი'}`}
                        </h4>
                        {room.description && (
                          <p className="text-sm text-gray-600">{room.description}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Badge variant={room.type === 'channel' ? 'default' : 'secondary'}>
                            {room.type === 'channel' ? 'არხი' : 'პირადი'}
                          </Badge>
                          <Badge variant={room.is_public ? 'outline' : 'secondary'}>
                            {room.is_public ? 'საჯარო' : 'პრივატული'}
                          </Badge>
                          <Badge variant="outline">
                            {room.participant_count} წევრი
                          </Badge>
                          <Badge variant="outline">
                            {room.message_count} მესიჯი
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(room)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ჩატის რესეტი</AlertDialogTitle>
                            <AlertDialogDescription>
                              დარწმუნებული ხართ, რომ გსურთ ამ ჩატის ისტორიის წაშლა?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleResetRoom(room.id)}>
                              რესეტი
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ჩატის წაშლა</AlertDialogTitle>
                            <AlertDialogDescription>
                              დარწმუნებული ხართ, რომ გსურთ ამ ჩატის სრულად წაშლა? ეს მოქმედება შეუქცევადია.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>
                              წაშლა
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>მონაწილეები</CardTitle>
              {selectedRoomId && (
                <div className="text-sm text-gray-600">
                  არჩეული ჩატი: {rooms.find(r => r.id === selectedRoomId)?.name || 'უსახელო'}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedRoomId ? (
                <p className="text-gray-500">აირჩიეთ ჩატი მონაწილეების სანახავად</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {participant.profile?.first_name} {participant.profile?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{participant.profile?.email}</p>
                        <p className="text-xs text-gray-500">
                          შეუერთდა: {new Date(participant.joined_at).toLocaleString('ka-GE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatManagement;
