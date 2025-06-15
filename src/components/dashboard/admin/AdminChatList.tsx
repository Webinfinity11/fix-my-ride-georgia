
import React from "react";
import { useAdminChatRooms, AdminChatRoom } from "@/hooks/useAdminChatRooms";
import { Hash, User, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect?: (room: AdminChatRoom) => void;
  selectedRoomId?: string;
};

export const AdminChatList: React.FC<Props> = ({ onSelect, selectedRoomId }) => {
  const { data: rooms, isLoading, error, refetch } = useAdminChatRooms();

  console.log('AdminChatList render:', { 
    rooms: rooms?.length, 
    isLoading, 
    error: error?.message 
  });

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
          <p className="text-sm mb-2">შეცდომა ჩატების წამოღებისას</p>
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
      <div>
        <h3 className="font-semibold text-sm mb-2">არხები ({channels.length})</h3>
        {channels.length === 0 && <div className="text-gray-500 text-xs">არხები არ არის</div>}
        <ul className="space-y-1">
          {channels.map((room) => (
            <li key={room.id}>
              <Button
                variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                className="w-full justify-start flex items-center gap-2 py-1.5 px-3"
                onClick={() => onSelect?.(room)}
              >
                <Hash className="h-4 w-4" />
                <span className="truncate">{room.name || `არხი ${room.id.slice(0, 8)}`}</span>
              </Button>
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
              <Button
                variant={selectedRoomId === room.id ? "secondary" : "ghost"}
                className="w-full justify-start flex items-center gap-2 py-1.5 px-3"
                onClick={() => onSelect?.(room)}
              >
                <User className="h-4 w-4" />
                <span className="truncate">{room.name || `ჩატი ${room.id.slice(0, 8)}`}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
