
import React from 'react';
import { ChatList } from './ChatList';
import { JoinChannelsButton } from './JoinChannelsButton';

export const ChatSidebar = () => {
  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg">ჩატები</h2>
      </div>

      <div className="p-4">
        <JoinChannelsButton />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatList />
      </div>
    </div>
  );
};
