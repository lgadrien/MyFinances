"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import GlobalSettingsToggles from "./GlobalSettingsToggles";

export default function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      {/* Desktop Sidebar */}
      {!isLoginPage && (
        <Sidebar
          className="fixed left-0 top-0 z-40 hidden md:flex"
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      )}

      {/* Mobile Header */}
      {!isLoginPage && (
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md md:hidden">
          <span className="text-lg font-bold text-white">MyFinances</span>
          <GlobalSettingsToggles horizontal />
        </div>
      )}

      {/* Mobile Bottom Nav */}
      {!isLoginPage && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}

      {/* Main Content */}
      <main
        className={
          isLoginPage
            ? ""
            : `min-h-screen p-4 pb-24 transition-all duration-300 md:p-8 md:pb-8 ${
                isCollapsed ? "md:ml-20" : "md:ml-64"
              }`
        }
      >
        {children}
      </main>
    </div>
  );
}
