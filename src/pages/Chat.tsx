
import React, { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Chat = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ჩატისთვის საჭიროა ავტორიზაცია</h2>
            <p className="text-gray-600">
              ჩატის სისტემის გამოსაყენებლად გთხოვთ, გაიაროთ ავტორიზაცია.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isMobile) {
    return (
      <Layout>
        <div className="h-[calc(100vh-134px)] flex flex-col">
          {/* Mobile Header with Menu Button */}
          <div className="border-b bg-white p-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">ჩატები</h1>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <ChatSidebar />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Chat Window */}
          <div className="flex-1">
            <ChatWindow />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex">
        <div className="hidden md:block">
          <ChatSidebar />
        </div>
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
