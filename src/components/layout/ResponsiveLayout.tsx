"use client";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar className="fixed left-0 top-0 z-40" />
      </div>

      {/* Mobile Header (Branding only) */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-center border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md md:hidden">
        <span className="text-lg font-bold text-white">MyFinances</span>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Main Content */}
      <main className="min-h-screen p-4 pb-24 transition-all md:ml-64 md:p-8 md:pb-8">
        {children}
      </main>
    </div>
  );
}
