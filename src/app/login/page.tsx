"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Successful login
        router.push("/");
        router.refresh(); // Refresh to update middleware state
      } else {
        setError("Mot de passe incorrect");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-black p-4 font-sans text-zinc-200">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-violet-500/10 p-4 ring-1 ring-violet-500/20">
            <Lock className="h-8 w-8 text-violet-400" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Accès sécurisé
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Veuillez saisir le mot de passe pour accéder au tableau de bord.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-4 pr-10 text-sm outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 placeholder:text-zinc-600"
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-center text-sm font-medium text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-violet-500/30 disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Accéder"}
          </button>
        </form>
      </div>
    </div>
  );
}
