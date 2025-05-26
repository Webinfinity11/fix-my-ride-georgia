
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    sender_name?: string;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  senderAvatar?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  showAvatar = false,
  senderAvatar 
}) => {
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { 
    addSuffix: true,
    locale: ka 
  });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {message.sender_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && message.sender_name && (
            <div className="text-xs text-gray-600 mb-1 px-1">
              {message.sender_name}
            </div>
          )}
          
          <Card className={`p-3 ${
            isOwn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </div>
          </Card>
          
          <div className={`text-xs mt-1 px-1 ${
            isOwn ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {timeAgo}
          </div>
        </div>
      </div>
    </div>
  );
};
