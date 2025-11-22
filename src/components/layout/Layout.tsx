import React from "react";
import { Header } from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { AddListingFAB } from "./AddListingFAB";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipToContent />
      
      <Header />
      <main id="main-content" className="flex-grow pb-[70px] md:pb-0" role="main" aria-label="ძირითადი კონტენტი">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <AddListingFAB />
    </div>
  );
};

export default Layout;