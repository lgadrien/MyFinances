import type { Metadata, Viewport } from "next";
import "./globals.css";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "MyFinances — Suivi Portefeuille PEA & Bourse",
  description:
    "Application de suivi de portefeuille boursier PEA. Suivez vos investissements, dividendes, analyse technique et fiscalité en temps réel.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyFinances",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-zinc-50 antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <QueryProvider>
          <ResponsiveLayout>{children}</ResponsiveLayout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#18181b", // zinc-900
                color: "#fafafa", // zinc-50
                border: "1px solid #27272a", // zinc-800
              },
              success: {
                iconTheme: {
                  primary: "#8b5cf6", // violet-500
                  secondary: "#fff",
                },
              },
            }}
          />
          <SpeedInsights />
        </QueryProvider>
      </body>
    </html>
  );
}
