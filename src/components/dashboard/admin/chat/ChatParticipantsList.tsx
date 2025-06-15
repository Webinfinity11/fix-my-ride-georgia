
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Circle } from "lucide-react";

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

interface ChatParticipantsListProps {
  participants: ChatParticipant[];
  selectedRoomName?: string;
  loading: boolean;
}

export const ChatParticipantsList: React.FC<ChatParticipantsListProps> = ({
  participants,
  selectedRoomName,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>მონაწილეების ჩატვირთვა...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>მონაწილეები ({participants.length})</CardTitle>
        {selectedRoomName && (
          <div className="text-sm text-gray-600">
            არჩეული ჩატი: {selectedRoomName}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedRoomName ? 'ამ ჩატში მონაწილეები არ მოიძებნა' : 'აირჩიეთ ჩატი მონაწილეების სანახავად'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                    <Circle className="h-3 w-3 fill-green-500 text-green-500 absolute -bottom-1 -right-1" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {participant.profile?.first_name} {participant.profile?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{participant.profile?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    შეუერთდა: {new Date(participant.joined_at).toLocaleDateString('ka-GE')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
