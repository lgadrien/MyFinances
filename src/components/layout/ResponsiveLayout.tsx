"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import GlobalSettingsToggles from "./GlobalSettingsToggles";
import { Bell, Wallet } from "lucide-react";
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
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col">
      {/* Desktop Sidebar */}
      {!isLoginPage && (
        <Sidebar
          className="fixed left-0 top-0 z-40 hidden md:flex"
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          onOpenAlerts={() => setIsModalOpen(true)}
        />
      )}

      {/* Mobile Header (Fixed with blur and safe-area top) */}
      {!isLoginPage && (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800/80 bg-black/80 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/20">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white leading-none block">
                MyFinances
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-violet-400">
                PEA Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 active:scale-95 transition-all hover:text-white"
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
        </header>
      )}

      {/* Mobile Bottom Navigation Bar */}
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
            : `flex-1 p-3.5 pb-28 sm:p-6 transition-all duration-300 md:p-8 md:pb-8 ${
                isCollapsed ? "md:ml-20" : "md:ml-64"
              }`
        }
      >
        {children}
      </main>
    </div>
  );
}
