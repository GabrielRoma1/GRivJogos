"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/user/login" : "/api/auth/user/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro. Tente novamente.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Falha ao se conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-950 items-center justify-center p-4">
      {/* Botão Voltar */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-purple-900/50 hover:bg-pink-500 hover:text-white transition-all text-purple-300"
        >
          ⬅️ Voltar
        </Link>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-purple-900/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
        {/* Glow effect atrás */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-400 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-3xl shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            G
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">
            GRIV JOGOS
          </h1>
          <p className="text-purple-300 text-sm mt-1">
            {isLogin ? "Entre para salvar seu progresso" : "Crie sua conta e salve seus favoritos"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1 ml-1 uppercase tracking-wider">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              required
              className="w-full bg-slate-900/50 border border-purple-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 placeholder-purple-300/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1 ml-1 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-900/50 border border-purple-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder-purple-300/30 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : isLogin ? (
              "Entrar no Arcade 🎮"
            ) : (
              "Criar Conta 🚀"
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-sm text-cyan-400 hover:text-pink-400 transition-colors"
          >
            {isLogin
              ? "Não tem uma conta? Crie uma agora!"
              : "Já possui conta? Faça login!"}
          </button>
        </div>
      </div>
    </div>
  );
}
