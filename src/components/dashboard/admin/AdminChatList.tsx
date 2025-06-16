
import React, { useState } from "react";
import { useAdminChatRooms, AdminChatRoom } from "@/hooks/useAdminChatRooms";
import { useDeleteChatRoom } from "@/hooks/useDeleteChatRoom";
import { Hash, User, RefreshCw, AlertCircle, Trash2, CheckSquare, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onSelect?: (room: AdminChatRoom) => void;
  selectedRoomId?: string;
};

export const AdminChatList: React.FC<Props> = ({ onSelect, selectedRoomId }) => {
  const { data: rooms, isLoading, error, refetch } = useAdminChatRooms();
  const deleteChatRoom = useDeleteChatRoom();
  const { toast } = useToast();
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  
  console.log('AdminChatList render:', { 
    rooms: rooms?.length, 
    isLoading, 
    error: error?.message 
  });

  const handleBulkDelete = async () => {
    if (selectedRooms.length === 0) {
      toast({
        title: "შეცდომა",
        description: "აირჩიეთ ჩატები წასაშლელად",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${selectedRooms.length} ჩატის წაშლა?`)) {
      for (const roomId of selectedRooms) {
        try {
          await deleteChatRoom.mutateAsync(roomId);
        } catch (error) {
          console.error('Error deleting room:', roomId, error);
        }
      }
      setSelectedRooms([]);
      setBulkDeleteMode(false);
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const selectAllRooms = () => {
    if (!rooms) return;
    setSelectedRooms(rooms.map(room => room.id));
  };

  const clearSelection = () => {
    setSelectedRooms([]);
  };

  if (isLoading) {
    return (
      <Card className="p-3 flex flex-col gap-4 w-full h-full max-w-xs bg-background shadow-none">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">ჩატვირთვა...</span>
        </div>
      </Card>
    );
  }
  
  if (error) {
    console.error('Error in AdminChatList:', error);
    return (
      <Card className="p-3 flex flex-col gap-4 w-full h-full max-w-xs bg-background shadow-none">
        <div className="text-red-600 text-center py-4">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p className="text-sm mb-2">შეცდომა ჩატების წამოღებისას</p>
          <p className="text-xs text-gray-500 mb-3">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            ხელახლა ცდა
          </Button>
        </div>
      </Card>
    );
  }

  // არხები პირველში, პირადი მეორეში
  const channels = (rooms || []).filter((r) => r.type === "channel");
  const directs = (rooms || []).filter((r) => r.type === "direct");

  return (
    <Card className="p-3 flex flex-col gap-4 w-full h-full max-w-xs bg-background shadow-none">
      {/* ბალკ ოპერაციების ჰედერი */}
      <div className="flex items-center justify-between">
        <Button
          variant={bulkDeleteMode ? "secondary" : "outline"}
          size="sm"
          onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
          className="flex items-center gap-2"
        >
          {bulkDeleteMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {bulkDeleteMode ? "გათიშვა" : "მრავალი არჩევა"}
        </Button>
        
        {bulkDeleteMode && (
          <div className="flex gap-1">
            <Button onClick={selectAllRooms} variant="ghost" size="sm">
              ყველას არჩევა
            </Button>
            <Button onClick={clearSelection} variant="ghost" size="sm">
              გასუფთავება
            </Button>
          </div>
        )}
      </div>

      {/* ბალკ წაშლის ღილაკი */}
      {bulkDeleteMode && selectedRooms.length > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={deleteChatRoom.isPending}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          წაშლა ({selectedRooms.length})
        </Button>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-2">არხები ({channels.length})</h3>
        {channels.length === 0 && <div className="text-gray-500 text-xs">არხები არ არის</div>}
        <ul className="space-y-1">
          {channels.map((room) => (
            <li key={room.id}>
              <div className="flex items-center gap-2">
                {bulkDeleteMode && (
                  <Checkbox
                    checked={selectedRooms.includes(room.id)}
                    onCheckedChange={() => toggleRoomSelection(room.id)}
                  />
                )}
                <Button
                  variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start flex items-center gap-2 py-1.5 px-3"
                  onClick={() => !bulkDeleteMode && onSelect?.(room)}
                >
                  <Hash className="h-4 w-4" />
                  <span className="truncate">{room.name || `არხი ${room.id.slice(0, 8)}`}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2">პირადი ჩატები ({directs.length})</h3>
        {directs.length === 0 && <div className="text-gray-500 text-xs">პირადი ჩატები არ არის</div>}
        <ul className="space-y-1">
          {directs.map((room) => (
            <li key={room.id}>
              <div className="flex items-center gap-2">
                {bulkDeleteMode && (
                  <Checkbox
                    checked={selectedRooms.includes(room.id)}
                    onCheckedChange={() => toggleRoomSelection(room.id)}
                  />
                )}
                <Button
                  variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start flex items-center gap-2 py-1.5 px-3"
                  onClick={() => !bulkDeleteMode && onSelect?.(room)}
                >
                  <User className="h-4 w-4" />
                  <span className="truncate">{room.name || `ჩატი ${room.id.slice(0, 8)}`}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
