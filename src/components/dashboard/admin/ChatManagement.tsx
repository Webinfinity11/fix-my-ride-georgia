
import React, { useState } from "react";
import { AdminChatList } from "./AdminChatList";
import { CreateChatDialog } from "./CreateChatDialog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AdminChatRoom } from "@/hooks/useAdminChatRooms";

const ChatManagement = () => {
  const [selectedRoom, setSelectedRoom] = useState<AdminChatRoom | null>(null);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full min-h-[360px]">
      {/* მარცხენა მხარე — სია */}
      <div className="w-full md:w-64">
        <div className="space-y-3">
          <CreateChatDialog />
          <AdminChatList
            onSelect={setSelectedRoom}
            selectedRoomId={selectedRoom?.id}
          />
        </div>
      </div>

      {/* არჩეული ოთახის დეტალები */}
      <div className="flex-1">
        {selectedRoom ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRoom.name || (selectedRoom.type === "channel" ? "არხი" : "პირადი ჩატი")}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({selectedRoom.type === "channel" ? "არხი" : "პირადი"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoom.description && (
                <div className="mb-2 text-muted-foreground">{selectedRoom.description}</div>
              )}
              <div className="text-xs text-gray-500">
                ჩანიშვნის დრო: {selectedRoom.created_at ? new Date(selectedRoom.created_at).toLocaleString("ka-GE") : "უცნობი"}
              </div>
              <div className="mt-4 italic text-gray-400">
                (მეტი დეტალი და მოქმედებები დაემატება შემდეგ ეტაპზე)
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>არჩევა დაიწყეთ სიის არჩევით</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">აირჩიეთ არხი ან პირადი ჩატი მარცხნიდან.</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;
