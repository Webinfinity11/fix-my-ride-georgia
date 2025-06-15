
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Hash, User } from "lucide-react";

interface ChatStatsProps {
  totalRooms: number;
  totalChannels: number;
  totalDirectChats: number;
  totalMessages: number;
  totalParticipants: number;
  loading: boolean;
}

export const ChatStats: React.FC<ChatStatsProps> = ({
  totalRooms,
  totalChannels,
  totalDirectChats,
  totalMessages,
  totalParticipants,
  loading
}) => {
  const stats = [
    {
      title: "სულ ჩატები",
      value: totalRooms,
      icon: MessageCircle,
      color: "text-blue-600"
    },
    {
      title: "არხები",
      value: totalChannels,
      icon: Hash,
      color: "text-green-600"
    },
    {
      title: "პირადი ჩატები",
      value: totalDirectChats,
      icon: User,
      color: "text-purple-600"
    },
    {
      title: "სულ მესიჯები",
      value: totalMessages,
      icon: MessageCircle,
      color: "text-orange-600"
    },
    {
      title: "აქტიური მონაწილეები",
      value: totalParticipants,
      icon: Users,
      color: "text-indigo-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
