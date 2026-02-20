import { Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-zinc-50">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
        {/* 404 large */}
        <div className="select-none">
          <span className="bg-gradient-to-br from-violet-400 to-fuchsia-500 bg-clip-text text-9xl font-black tracking-tight text-transparent">
            404
          </span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">
            Page introuvable
          </h1>
          <p className="text-sm text-zinc-400">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Link>
          <Link
            href="/marche"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700/50"
          >
            <Search className="h-4 w-4" />
            Marché
          </Link>
        </div>

        {/* Nav links */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-600">
          {[
            { href: "/transactions", label: "Transactions" },
            { href: "/portefeuille", label: "Portefeuille" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:text-zinc-400"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
