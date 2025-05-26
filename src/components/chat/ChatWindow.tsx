
import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Hash, User } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { MessageBubble } from './MessageBubble';

export const ChatWindow = () => {
  const { activeRoom, messages, sendMessage } = useChat();
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
          <div>
            <h2 className="font-semibold text-lg">
              {activeRoom.name || 'პირადი ჩატი'}
            </h2>
            {activeRoom.description && (
              <p className="text-sm text-gray-500">{activeRoom.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">მესიჯები არ არის</p>
              <p className="text-sm text-gray-400">დაწყებეთ საუბარი...</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showAvatar={activeRoom.type === 'channel'}
              />
            ))
          )}
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
