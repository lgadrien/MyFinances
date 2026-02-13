import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "MyFinances — PEA Portfolio Tracker",
  description:
    "Application de tracking de portefeuille boursier PEA. Suivez vos actions, dividendes et plus-values en temps réel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-black text-zinc-50 antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <div className="flex">
          <Sidebar />
          <main className="ml-64 min-h-screen flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
