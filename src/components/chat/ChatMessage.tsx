
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Circle, Download, Play, File } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    sender_name?: string;
    created_at: string;
    file_url?: string;
    file_type?: 'image' | 'video' | 'file';
    file_name?: string;
  };
  currentUserId?: string;
  isOnline?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  currentUserId, 
  isOnline = false 
}) => {
  const isOwnMessage = message.sender_id === currentUserId;

  const handleDownload = () => {
    if (message.file_url && message.file_name) {
      const link = document.createElement('a');
      link.href = message.file_url;
      link.download = message.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFileContent = () => {
    if (!message.file_url || !message.file_type) return null;

    switch (message.file_type) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={message.file_url} 
              alt={message.file_name || 'Uploaded image'}
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(message.file_url, '_blank')}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-2">
            <video 
              src={message.file_url}
              controls
              className="max-w-xs rounded-lg"
              preload="metadata"
            >
              თქვენი ბრაუზერი არ უჭერს მხარს ვიდეოს
            </video>
          </div>
        );
      
      case 'file':
        return (
          <div className="mt-2 p-3 border rounded-lg bg-gray-50 max-w-xs">
            <div className="flex items-center gap-2">
              <File className="h-5 w-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.file_name || 'Unknown file'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <Card className={`p-3 max-w-xs sm:max-w-sm ${
        isOwnMessage 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-white'
      }`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <span className="truncate">{message.sender_name}</span>
            {isOnline && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500 flex-shrink-0" />
            )}
          </div>
        )}
        
        {message.content && (
          <div className="text-sm break-words">{message.content}</div>
        )}
        
        {renderFileContent()}
        
        <div className={`text-xs mt-1 ${
          isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-400'
        }`}>
          {new Date(message.created_at).toLocaleTimeString('ka-GE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </Card>
    </div>
  );
};
