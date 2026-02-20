import type { Metadata } from "next";
import "./globals.css";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";

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
        </QueryProvider>
      </body>
    </html>
  );
}
