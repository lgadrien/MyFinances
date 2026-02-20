"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-zinc-50">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Une erreur est survenue
          </h1>
          <p className="text-sm text-zinc-400">
            {error.message ||
              "Quelque chose s'est mal passé. Veuillez réessayer."}
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-zinc-600">
              ID : {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700/50 hover:border-zinc-600"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
