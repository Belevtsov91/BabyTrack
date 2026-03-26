import { ReactNode } from "react";
import { TabBar } from "./TabBar";
import { Sidebar } from "./Sidebar";
import { GlassFilter } from "@/components/ui/liquid-radio";

interface AppLayoutProps {
  children:    ReactNode;
  showTabBar?: boolean;
}

export function AppLayout({ children, showTabBar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <GlassFilter />
      {/* Sidebar — tablet / desktop only */}
      <Sidebar />

      {/* Main scrollable area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/*
          Mobile : narrow centred column + bottom padding for tabbar
          md+    : full remaining width, no bottom padding
        */}
        <div className="max-w-md mx-auto w-full md:max-w-none pb-24 md:pb-0 flex-1">
          {children}
        </div>
      </div>

      {/* TabBar — mobile only */}
      {showTabBar && <TabBar />}
    </div>
  );
}
