
import React, { useState } from "react";
import { AdminChatList } from "./AdminChatList";
import { CreateChatDialog } from "./CreateChatDialog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { AdminChatRoom } from "@/hooks/useAdminChatRooms";

const ChatManagement = () => {
  const [selectedRoom, setSelectedRoom] = useState<AdminChatRoom | null>(null);

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit room:", selectedRoom);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log("Delete room:", selectedRoom);
  };

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
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedRoom.name || (selectedRoom.type === "channel" ? "არხი" : "პირადი ჩატი")}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({selectedRoom.type === "channel" ? "არხი" : "პირადი"})
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    რედაქტირება
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    წაშლა
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedRoom.description && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-1">აღწერა:</h4>
                  <p className="text-muted-foreground">{selectedRoom.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ტიპი:</span>
                  <p className="text-muted-foreground">
                    {selectedRoom.type === "channel" ? "საჯარო არხი" : "პირადი ჩატი"}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">მდგომარეობა:</span>
                  <p className="text-muted-foreground">
                    {selectedRoom.is_public ? "საჯარო" : "პრივატული"}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">შექმნის თარიღი:</span>
                  <p className="text-muted-foreground">
                    {selectedRoom.created_at 
                      ? new Date(selectedRoom.created_at).toLocaleString("ka-GE") 
                      : "უცნობი"}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">
                    {selectedRoom.id}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">სტატისტიკა:</h4>
                <div className="text-sm text-gray-600">
                  <p>• მონაწილეების რაოდენობა: ჯერ არ არის განხორციელებული</p>
                  <p>• მესიჯების რაოდენობა: ჯერ არ არის განხორციელებული</p>
                  <p>• ბოლო აქტივობა: ჯერ არ არის განხორციელებული</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>არჩევა დაიწყეთ ჩატის არჩევით</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                აირჩიეთ არხი ან პირადი ჩატი მარცხენა სიიდან მისი დეტალების სანახავად და მართვისთვის.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatManagement;
