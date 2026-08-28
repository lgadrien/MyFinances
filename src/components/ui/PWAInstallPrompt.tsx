"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true
    );
  });

  const [isIOS] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem("myfinances_pwa_dismissed"));
  });

  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Listen for beforeinstallprompt event (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isStandalone]);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSTip(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("myfinances_pwa_dismissed", "true");
  };

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-6 md:left-auto md:right-6 md:w-96 rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Installer MyFinances
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Accès instantané et expérience plein écran sur mobile
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-violet-700 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Installer l&apos;application</span>
          </button>
        </div>
      </div>

      {/* iOS instructions modal tip */}
      {showIOSTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 mb-4">
              <Share className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Installer sur iPhone / iPad
            </h3>
            <div className="text-xs text-zinc-300 space-y-3 mt-4 text-left">
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-violet-400">
                  1
                </span>
                <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="inline h-3.5 w-3.5 text-violet-400" /> dans Safari.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-violet-400">
                  2
                </span>
                <span>Faites défiler vers le bas et sélectionnez <strong>Sur l&apos;écran d&apos;accueil</strong> <PlusSquare className="inline h-3.5 w-3.5 text-violet-400" />.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-violet-400">
                  3
                </span>
                <span>Appuyez sur <strong>Ajouter</strong> en haut à droite.</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSTip(false)}
              className="mt-6 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-700"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
