"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigate
  useEffect(() => {
    // eslint-disable-next-line
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar className="fixed left-0 top-0 z-40" />
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-white">MyFinances</span>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-xs animate-in slide-in-from-left duration-300">
            <Sidebar
              className="static h-full w-full border-r-0"
              onNavigate={() => setIsOpen(false)}
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen p-4 transition-all md:ml-64 md:p-8">
        {children}
      </main>
    </div>
  );
}
