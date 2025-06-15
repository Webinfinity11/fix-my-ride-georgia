
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Hash, User, Settings, Edit, Trash2, RefreshCw } from "lucide-react";

interface ChatRoom {
  id: string;
  name: string | null;
  type: 'direct' | 'channel';
  description?: string | null;
  is_public: boolean;
  created_at: string;
  participant_count?: number;
  message_count?: number;
}

interface ChatRoomListProps {
  rooms: ChatRoom[];
  onEditRoom: (room: ChatRoom) => void;
  onDeleteRoom: (roomId: string) => void;
  onResetRoom: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
  loading: boolean;
}

export const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  onEditRoom,
  onDeleteRoom,
  onResetRoom,
  onSelectRoom,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ჩატების ჩატვირთვა...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ყველა ჩატი ({rooms.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ჩატები არ მოიძებნა</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                      <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant={room.type === 'channel' ? 'default' : 'secondary'}>
                        {room.type === 'channel' ? 'არხი' : 'პირადი'}
                      </Badge>
                      <Badge variant={room.is_public ? 'outline' : 'secondary'}>
                        {room.is_public ? 'საჯარო' : 'პრივატული'}
                      </Badge>
                      <Badge variant="outline">
                        {room.participant_count || 0} წევრი
                      </Badge>
                      <Badge variant="outline">
                        {room.message_count || 0} მესიჯი
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectRoom(room.id)}
                    title="მონაწილეების ნახვა"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditRoom(room)}
                    title="რედაქტირება"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" title="ისტორიის წაშლა">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ჩატის რესეტი</AlertDialogTitle>
                        <AlertDialogDescription>
                          დარწმუნებული ხართ, რომ გსურთ ამ ჩატის მესიჯების ისტორიის წაშლა?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onResetRoom(room.id)}>
                          რესეტი
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" title="ჩატის წაშლა">
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
                        <AlertDialogAction onClick={() => onDeleteRoom(room.id)}>
                          წაშლა
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
