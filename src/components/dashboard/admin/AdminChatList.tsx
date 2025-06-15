
import React from "react";
import { useAdminChatRooms, AdminChatRoom } from "@/hooks/useAdminChatRooms";
import { Hash, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect?: (room: AdminChatRoom) => void;
  selectedRoomId?: string;
};

export const AdminChatList: React.FC<Props> = ({ onSelect, selectedRoomId }) => {
  const { data: rooms, isLoading, error } = useAdminChatRooms();

  console.log('AdminChatList render:', { rooms, isLoading, error });

  if (isLoading) return <div className="text-center py-4">ჩატვირთვა...</div>;
  
  if (error) {
    console.error('Error in AdminChatList:', error);
    return <div className="text-red-600 text-center py-4">შეცდომა ჩატების წამოღებისას: {error.message}</div>;
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
                <span className="truncate">{room.name || `არხი ${room.id.slice(0, 5)}`}</span>
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
                <span className="truncate">{room.name || `ჩატი ${room.id.slice(0, 5)}`}</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
