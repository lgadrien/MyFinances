"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import GlobalSettingsToggles from "./GlobalSettingsToggles";
import { Bell } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import dynamic from "next/dynamic";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";

const AlertsCenterModal = dynamic(
  () => import("@/components/alerts/AlertsCenterModal"),
  { ssr: false },
);

export default function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadCount, isModalOpen, setIsModalOpen } = useAlerts();

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      {/* Desktop Sidebar */}
      {!isLoginPage && (
        <Sidebar
          className="fixed left-0 top-0 z-40 hidden md:flex"
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          onOpenAlerts={() => setIsModalOpen(true)}
        />
      )}

      {/* Mobile Header */}
      {!isLoginPage && (
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md md:hidden">
          <span className="text-lg font-bold text-white">MyFinances</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              title="Centre d'alertes"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-black">
                  {unreadCount}
                </span>
              )}
            </button>
            <GlobalSettingsToggles horizontal />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      {!isLoginPage && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}

      {/* Alerts Modal */}
      <AlertsCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* PWA Mobile Install Banner */}
      {!isLoginPage && <PWAInstallPrompt />}

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
