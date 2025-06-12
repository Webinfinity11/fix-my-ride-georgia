
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Hash, User, Circle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatFileUpload } from './ChatFileUpload';
import { ChatMessage } from './ChatMessage';

export const ChatWindow = () => {
  const { activeRoom, messages, sendMessage, onlineUsers } = useChat();
  const { user } = useAuth();
  const isMobile = useIsMobile();
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

  const handleFileUploaded = async (fileUrl: string, fileType: 'image' | 'video' | 'file', fileName: string) => {
    // Send message with file attachment
    await sendMessage(``, fileUrl, fileType, fileName);
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
        <div className="text-center px-4">
          <Hash className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ჩატის არჩევა</h3>
          <p className="text-gray-500 text-sm">
            {isMobile 
              ? 'მენიუდან აირჩიეთ ჩატი საუბრის დასაწყებად' 
              : 'აირჩიეთ ჩატი საუბრის დასაწყებად'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-3 md:p-4 bg-white">
        <div className="flex items-center gap-3">
          {activeRoom.type === 'channel' ? (
            <Hash className="h-5 w-5 text-gray-500 flex-shrink-0" />
          ) : (
            <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base md:text-lg truncate">
              {getChatTitle()}
            </h2>
            {activeRoom.description && (
              <p className="text-xs md:text-sm text-gray-500 truncate">{activeRoom.description}</p>
            )}
            {activeRoom.type === 'direct' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Circle className={`h-2 w-2 ${isOtherParticipantOnline() ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}`} />
                <span>{isOtherParticipantOnline() ? 'ონლაინ' : 'ოფლაინ'}</span>
              </div>
            )}
          </div>
          {activeRoom.type === 'channel' && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
              <span className="hidden sm:inline">{onlineUsers.length} ონლაინ</span>
              <span className="sm:hidden">{onlineUsers.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 md:p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              currentUserId={user?.id}
              isOnline={onlineUsers.includes(message.sender_id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t bg-white">
        <div className="flex gap-2">
          <ChatFileUpload onFileUploaded={handleFileUploaded} />
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
