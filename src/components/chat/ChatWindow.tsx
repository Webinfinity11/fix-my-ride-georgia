
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Hash, User, Circle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';

export const ChatWindow = () => {
  const { activeRoom, messages, sendMessage, onlineUsers } = useChat();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      await sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const getChatTitle = () => {
    if (!activeRoom) return '';
    
    if (activeRoom.type === 'channel') {
      return activeRoom.name || 'არხი';
    } else {
      if (activeRoom.other_participant) {
        return `${activeRoom.other_participant.first_name} ${activeRoom.other_participant.last_name}`;
      }
      return 'პირადი ჩატი';
    }
  };

  const isOtherParticipantOnline = () => {
    if (activeRoom?.type === 'direct' && activeRoom.other_participant) {
      return onlineUsers.includes(activeRoom.other_participant.id);
    }
    return false;
  };

  if (!activeRoom) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Hash className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">ჩატის არჩევა</h3>
          <p className="text-gray-500">აირჩიეთ ჩატი საუბრის დასაწყებად</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center gap-3">
          {activeRoom.type === 'channel' ? (
            <Hash className="h-5 w-5 text-gray-500" />
          ) : (
            <User className="h-5 w-5 text-gray-500" />
          )}
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              {getChatTitle()}
            </h2>
            {activeRoom.description && (
              <p className="text-sm text-gray-500">{activeRoom.description}</p>
            )}
            {activeRoom.type === 'direct' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Circle className={`h-2 w-2 ${isOtherParticipantOnline() ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}`} />
                <span>{isOtherParticipantOnline() ? 'ონლაინ' : 'ოფლაინ'}</span>
              </div>
            )}
          </div>
          {/* Online indicator for channels */}
          {activeRoom.type === 'channel' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              <span>{onlineUsers.length} ონლაინ</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <Card className={`p-3 max-w-sm ${
                message.sender_id === user?.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-white'
              }`}>
                {message.sender_id !== user?.id && (
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                    <span>{message.sender_name}</span>
                    {onlineUsers.includes(message.sender_id) && (
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    )}
                  </div>
                )}
                <div className="text-sm break-words">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-gray-400'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString('ka-GE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="მესიჯის დაწერა..."
            className="flex-1"
            maxLength={1000}
          />
          <Button type="submit" size="icon" disabled={!messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
