
import React, { useState } from "react";
import { AdminChatList } from "./AdminChatList";
import { CreateChatDialog } from "./CreateChatDialog";
import { EditChatDialog } from "./EditChatDialog";
import { ChatParticipantsManager } from "./ChatParticipantsManager";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Users, BarChart3 } from "lucide-react";
import { AdminChatRoom } from "@/hooks/useAdminChatRooms";
import { useDeleteChatRoom } from "@/hooks/useDeleteChatRoom";
import { useChatStatistics } from "@/hooks/useChatStatistics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const ChatManagement = () => {
  const [selectedRoom, setSelectedRoom] = useState<AdminChatRoom | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const deleteChatRoom = useDeleteChatRoom();
  const { data: statistics } = useChatStatistics(selectedRoom?.id || "");

  const handleEdit = () => {
    if (selectedRoom) {
      setEditDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (selectedRoom && window.confirm("დარწმუნებული ხართ, რომ გსურთ ამ ჩატის წაშლა?")) {
      deleteChatRoom.mutate(selectedRoom.id);
      setSelectedRoom(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[600px]">
      {/* მარცხენა მხარე — სია */}
      <div className="w-full lg:w-80">
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
          <div className="space-y-4">
            {/* ზედა ბარი */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>
                      {selectedRoom.name || (selectedRoom.type === "channel" ? "არხი" : "პირადი ჩატი")}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={selectedRoom.type === "channel" ? "default" : "secondary"}>
                        {selectedRoom.type === "channel" ? "არხი" : "პირადი"}
                      </Badge>
                      <Badge variant={selectedRoom.is_public ? "outline" : "destructive"}>
                        {selectedRoom.is_public ? "საჯარო" : "პრივატული"}
                      </Badge>
                    </div>
                  </div>
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
                      disabled={deleteChatRoom.isPending}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      წაშლა
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* სტატისტიკების ბარი */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{statistics.participantCount}</p>
                        <p className="text-sm text-gray-600">მონაწილე</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{statistics.messageCount}</p>
                        <p className="text-sm text-gray-600">მესიჯი</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">ბოლო აქტივობა</p>
                        <p className="text-xs text-gray-600">
                          {statistics.lastActivity 
                            ? new Date(statistics.lastActivity).toLocaleString("ka-GE")
                            : "აქტივობა არ არის"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* მთავარი კონტენტი */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">დეტალები</TabsTrigger>
                <TabsTrigger value="participants">მონაწილეები</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>ძირითადი ინფორმაცია</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRoom.description && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-1">აღწერა:</h4>
                        <p className="text-muted-foreground">{selectedRoom.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">შექმნის თარიღი:</span>
                        <p className="text-muted-foreground">
                          {selectedRoom.created_at 
                            ? new Date(selectedRoom.created_at).toLocaleString("ka-GE") 
                            : "უცნობი"}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium">ჩატის ID:</span>
                        <p className="text-muted-foreground font-mono text-xs">
                          {selectedRoom.id}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants">
                <ChatParticipantsManager 
                  roomId={selectedRoom.id} 
                  roomName={selectedRoom.name || "უცნობი ჩატი"} 
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>აირჩიეთ ჩატი</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                აირჩიეთ არხი ან პირადი ჩატი მარცხენა სიიდან მისი დეტალების სანახავად და მართვისთვის.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* რედაქტირების დიალოგი */}
      {selectedRoom && (
        <EditChatDialog
          room={selectedRoom}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
};

export default ChatManagement;
