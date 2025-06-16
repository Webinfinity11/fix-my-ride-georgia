
import React, { useState } from "react";
import { useChatParticipants, useRemoveParticipant, ChatParticipant } from "@/hooks/useChatParticipants";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, UserMinus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  roomId: string;
  roomName: string;
};

export const ChatParticipantsManager: React.FC<Props> = ({ roomId, roomName }) => {
  const { data: participants, isLoading, error, refetch } = useChatParticipants(roomId);
  const removeParticipant = useRemoveParticipant();

  const handleRemoveParticipant = async (participant: ChatParticipant) => {
    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${participant.profile.first_name} ${participant.profile.last_name}-ის წაშლა ამ ჩატიდან?`)) {
      removeParticipant.mutate({ 
        participantId: participant.id, 
        roomId: participant.room_id 
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            მონაწილეების ჩატვირთვა...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">შეცდომა</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">მონაწილეების ჩატვირთვისას მოხდა შეცდომა</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            ხელახლა ცდა
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>მონაწილეები ({participants?.length || 0})</span>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!participants || participants.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <UserMinus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>ამ ჩატში მონაწილეები არ არიან</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {participant.profile.first_name?.[0]}{participant.profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {participant.profile.first_name} {participant.profile.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{participant.profile.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        შეუერთდა: {new Date(participant.joined_at).toLocaleDateString("ka-GE")}
                      </Badge>
                      {participant.last_read_at && (
                        <Badge variant="secondary" className="text-xs">
                          ბოლო ნანახი: {new Date(participant.last_read_at).toLocaleString("ka-GE")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant)}
                  disabled={removeParticipant.isPending}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  წაშლა
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
