"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-200">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
            <Lock className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Accès sécurisé
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          Veuillez saisir le mot de passe pour accéder au tableau de bord.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-center text-sm font-medium text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Accéder"}
          </button>
        </form>
      </div>
    </div>
  );
}
