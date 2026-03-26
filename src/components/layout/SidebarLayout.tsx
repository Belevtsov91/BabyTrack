import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { GlassFilter } from "@/components/ui/liquid-radio";

/**
 * Lightweight wrapper for pages that manage their own full-screen layout
 * (AddEvent, EventDetail). Adds the sidebar on md+ and TabBar on mobile
 * without imposing any width / padding constraints on the content.
 */
export function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <GlassFilter />
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
