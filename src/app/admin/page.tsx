"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    games: number;
  };
}

interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  gameType: string;
  gameUrl: string | null;
  swfFile: string | null;
  views: number;
  isActive: boolean;
  categoryId: string;
  category: {
    name: string;
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Estados de formulário de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dados do dashboard
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Estados de formulário de Jogo
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [gameCategory, setGameCategory] = useState("");
  const [gameType, setGameType] = useState("SWF"); // SWF ou HTML5
  const [gameUrl, setGameUrl] = useState("");
  const [gameImageFile, setGameImageFile] = useState<File | null>(null);
  const [gameSwfFile, setGameSwfFile] = useState<File | null>(null);
  const [gameIsActive, setGameIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Estados de nova categoria
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");

  // 1. Verificar autenticação
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setUser(data.user);
          loadDashboardData();
        }
      } catch (e) {
        console.error("Erro de autenticação:", e);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Carregar dados do dashboard
  async function loadDashboardData() {
    try {
      const [gamesRes, catsRes] = await Promise.all([
        fetch("/api/games?active=all"),
        fetch("/api/categories")
      ]);
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData);
      }
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }
    } catch (e) {
      console.error("Erro ao carregar dados administrativos:", e);
    }
  }

  // 3. Executar Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setUser(data.user);
        loadDashboardData();
      } else {
        setLoginError(data.error || "Falha no login");
      }
    } catch (err) {
      setLoginError("Erro de conexão com o servidor");
    } finally {
      setLoginLoading(false);
    }
  };

  // 4. Executar Logout
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setIsAuthenticated(false);
        setUser(null);
        setGames([]);
      }
    } catch (e) {
      console.error("Erro ao deslogar:", e);
    }
  };

  // 5. Cadastrar nova Categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    setCatSuccess("");

    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCatSuccess(`Categoria "${data.name}" criada com sucesso!`);
        setNewCategoryName("");
        loadDashboardData();
      } else {
        setCatError(data.error || "Erro ao criar categoria");
      }
    } catch (err) {
      setCatError("Erro ao criar categoria");
    }
  };

  // 6. Submeter cadastro ou edição de jogo
  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    if (!gameTitle || !gameDescription || !gameCategory) {
      setFormError("Preencha todos os campos obrigatórios.");
      setFormLoading(false);
      return;
    }

    if (!editingGame && !gameImageFile) {
      setFormError("O ícone do jogo é obrigatório para novos cadastros.");
      setFormLoading(false);
      return;
    }

    if (gameType === "SWF" && !editingGame && !gameSwfFile) {
      setFormError("O arquivo .swf é obrigatório para novos jogos em Flash.");
      setFormLoading(false);
      return;
    }

    if (gameType === "HTML5" && !gameUrl) {
      setFormError("A URL do jogo é obrigatória para jogos em HTML5.");
      setFormLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", gameTitle);
      formData.append("description", gameDescription);
      formData.append("categoryId", gameCategory);
      formData.append("gameType", gameType);
      formData.append("isActive", String(gameIsActive));
      if (gameType === "HTML5") formData.append("gameUrl", gameUrl);
      if (gameImageFile) formData.append("image", gameImageFile);
      if (gameType === "SWF" && gameSwfFile) formData.append("swf", gameSwfFile);

      const url = editingGame ? `/api/games/${editingGame.id}` : "/api/games";
      const method = editingGame ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setFormSuccess(editingGame ? "Jogo atualizado com sucesso!" : "Jogo cadastrado com sucesso!");
        resetGameForm();
        loadDashboardData();
      } else {
        setFormError(data.error || "Erro ao salvar o jogo");
      }
    } catch (err) {
      setFormError("Erro de comunicação com o servidor ao salvar o jogo");
    } finally {
      setFormLoading(false);
    }
  };

  const startEditGame = (game: Game) => {
    setEditingGame(game);
    setGameTitle(game.title);
    setGameDescription(game.description);
    setGameCategory(game.categoryId);
    setGameType(game.gameType);
    setGameUrl(game.gameUrl || "");
    setGameIsActive(game.isActive);
    setShowGameForm(true);
  };

  const resetGameForm = () => {
    setEditingGame(null);
    setGameTitle("");
    setGameDescription("");
    setGameCategory("");
    setGameType("SWF");
    setGameUrl("");
    setGameImageFile(null);
    setGameSwfFile(null);
    setGameIsActive(true);
    setShowGameForm(false);
  };

  // Excluir jogo
  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este jogo? Os arquivos no disco também serão deletados.")) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadDashboardData();
      } else {
        alert("Erro ao deletar jogo");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
        <p className="text-purple-300 font-semibold mt-3 animate-pulse">Verificando credenciais...</p>
      </div>
    );
  }

  // TELA DE LOGIN DO ADMIN
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-purple-500/20 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <Link
              href="/"
              className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white mb-2 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            >
              G
            </Link>
            <h2 className="text-2xl font-black text-white">Painel Administrativo</h2>
            <p className="text-xs text-purple-400 mt-1">Insira suas credenciais de administrador</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">E-mail</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="exemplo@grivjogos.com.br"
                className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-4 focus:outline-none focus:border-pink-500 placeholder-purple-300/20 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">Senha</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-4 focus:outline-none focus:border-pink-500 placeholder-purple-300/20 text-white text-sm"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                ⚠️ {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loginLoading ? "Acessando..." : "Entrar no Painel 🔑"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-purple-900/20 pt-4">
            <Link href="/" className="text-xs text-purple-400 hover:text-white transition-colors">
              ← Voltar para o Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TELA DO PAINEL PRINCIPAL DO ADMIN
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Admin */}
      <header className="glass-panel w-full py-4 px-6 md:px-12 flex justify-between items-center z-20 border-b border-purple-900/40">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center font-bold text-lg text-white">G</span>
            GRiv Admin
          </Link>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-700/50 text-cyan-400">
            Modo Gerente
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white font-bold">{user?.name}</p>
            <p className="text-[10px] text-purple-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
          >
            Sair 🚪
          </button>
        </div>
      </header>

      {/* Grid Administrativo */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Lado Esquerdo: Formulário de Jogo ou Categorias */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Formulário de Jogos (Cadastrar/Editar) */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-900/40 pb-2 flex justify-between items-center">
              <span>{editingGame ? "Editar Jogo" : "Cadastrar Novo Jogo"}</span>
              {showGameForm && (
                <button onClick={resetGameForm} className="text-xs text-purple-400 hover:text-white">
                  Cancelar
                </button>
              )}
            </h3>

            {!showGameForm && !editingGame ? (
              <button
                onClick={() => setShowGameForm(true)}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 rounded-xl text-white font-bold text-sm transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10"
              >
                ➕ Adicionar Novo Jogo
              </button>
            ) : (
              <form onSubmit={handleGameSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">Título do Jogo *</label>
                  <input
                    type="text"
                    required
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    placeholder="Ex: Super Mario Flash"
                    className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-3 focus:outline-none focus:border-pink-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">Categoria *</label>
                  <select
                    required
                    value={gameCategory}
                    onChange={(e) => setGameCategory(e.target.value)}
                    className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-3 focus:outline-none focus:border-pink-500 text-white text-sm"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">Descrição Curta *</label>
                  <textarea
                    required
                    rows={3}
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                    placeholder="Escreva uma breve descrição..."
                    className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-3 focus:outline-none focus:border-pink-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">Tipo de Tecnologia *</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 text-sm text-purple-200 cursor-pointer">
                      <input
                        type="radio"
                        name="gameType"
                        value="SWF"
                        checked={gameType === "SWF"}
                        onChange={() => setGameType("SWF")}
                        className="accent-pink-500"
                      />
                      SWF (Flash emulado)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-purple-200 cursor-pointer">
                      <input
                        type="radio"
                        name="gameType"
                        value="HTML5"
                        checked={gameType === "HTML5"}
                        onChange={() => setGameType("HTML5")}
                        className="accent-pink-500"
                      />
                      HTML5 (Iframe/URL)
                    </label>
                  </div>
                </div>

                {gameType === "SWF" ? (
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                      Arquivo Flash SWF * {editingGame && <span className="text-[10px] text-pink-400 lowercase">(envie apenas se quiser alterar)</span>}
                    </label>
                    <input
                      type="file"
                      accept=".swf"
                      required={!editingGame}
                      onChange={(e) => setGameSwfFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-900 file:text-purple-100 hover:file:bg-purple-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">URL Externa do Jogo *</label>
                    <input
                      type="url"
                      required
                      value={gameUrl}
                      onChange={(e) => setGameUrl(e.target.value)}
                      placeholder="https://exemplo.com/jogo-html5"
                      className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-3 focus:outline-none focus:border-pink-500 text-white text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                    Imagem de Ícone * {editingGame && <span className="text-[10px] text-pink-400 lowercase">(envie apenas se quiser alterar)</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingGame}
                    onChange={(e) => setGameImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-900 file:text-purple-100 hover:file:bg-purple-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gameIsActive"
                    checked={gameIsActive}
                    onChange={(e) => setGameIsActive(e.target.checked)}
                    className="accent-pink-500 w-4 h-4 rounded"
                  />
                  <label htmlFor="gameIsActive" className="text-xs font-semibold text-purple-200 select-none cursor-pointer">
                    Jogo ativo (aparece na página inicial)
                  </label>
                </div>

                {formError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                    ⚠️ {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-2 font-medium">
                    ✅ {formSuccess}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 rounded-xl font-bold text-white text-xs transition-all disabled:opacity-50"
                  >
                    {formLoading ? "Salvando..." : "Salvar Jogo 💾"}
                  </button>
                  <button
                    type="button"
                    onClick={resetGameForm}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-purple-900/50 rounded-xl text-xs text-purple-300 font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Gerenciamento Rápido de Categorias */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-900/40 pb-2">
              Adicionar Categoria
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 px-3 focus:outline-none focus:border-pink-500 text-white text-sm"
                />
              </div>

              {catError && <p className="text-xs text-red-400">{catError}</p>}
              {catSuccess && <p className="text-xs text-green-400">{catSuccess}</p>}

              <button
                type="submit"
                className="w-full py-2 bg-purple-900 hover:bg-purple-800 rounded-xl font-semibold text-xs text-white transition-colors"
              >
                Criar Categoria 🏷️
              </button>
            </form>
          </div>

        </div>

        {/* Lado Direito: Listagem e Gerenciamento de Jogos Existentes */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-purple-900/40 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-purple-900/40 pb-2 flex justify-between items-center">
            <span>Todos os Jogos Cadastrados ({games.length})</span>
            <span className="text-xs text-purple-400">Total de jogadas global</span>
          </h3>

          <div className="overflow-x-auto">
            {games.length === 0 ? (
              <p className="text-purple-300 text-sm text-center py-8">Nenhum jogo cadastrado ainda.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-900/40 text-purple-300/80">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Jogo</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Categoria</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Tipo</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Jogadas</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40">
                  {games.map((g) => (
                    <tr key={g.id} className="hover:bg-purple-950/10 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-purple-900/30">
                          <Image src={g.imageUrl} alt={g.title} fill className="object-cover" />
                        </div>
                        <span className="font-bold text-white">{g.title}</span>
                      </td>
                      <td className="py-3 text-purple-300">{g.category.name}</td>
                      <td className="py-3 font-semibold text-cyan-400">{g.gameType}</td>
                      <td className="py-3 text-center text-purple-300">{g.views}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          g.isActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {g.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => startEditGame(g)}
                          className="px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded text-[10px] text-white font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteGame(g.id)}
                          className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-900/40 rounded text-[10px] text-red-300 font-semibold"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="glass-panel w-full py-4 text-center text-xs text-purple-400/60 mt-auto border-t border-purple-900/20">
        <Link href="/" className="text-purple-300 hover:underline">← Voltar ao Portal</Link>
      </footer>
    </div>
  );
}
