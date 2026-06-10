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
  views: number;
  categoryId: string;
  category: {
    name: string;
    slug: string;
  };
}

const borderGlowClasses = [
  "border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] glow-pink",
  "border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] glow-blue",
  "border-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.6)] glow-green",
  "border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] glow-purple",
  "border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] glow-yellow"
];

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Favoritos locais
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    // Carregar favoritos do LocalStorage
    const storedFavs = localStorage.getItem("griv_favorites");
    if (storedFavs) {
      setFavorites(JSON.parse(storedFavs));
    }

    async function loadData() {
      try {
        const [gamesRes, catsRes] = await Promise.all([
          fetch("/api/games?active=all"), // Mostra todos os ativos
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
      } catch (error) {
        console.error("Erro ao carregar dados da página inicial:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const toggleFavorite = (gameId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let updated: string[];
    if (favorites.includes(gameId)) {
      updated = favorites.filter((id) => id !== gameId);
    } else {
      updated = [...favorites, gameId];
    }
    setFavorites(updated);
    localStorage.setItem("griv_favorites", JSON.stringify(updated));
  };

  // Filtros
  const filteredGames = games.filter((game) => {
    // 1. Categoria
    if (selectedCategory && game.category.slug !== selectedCategory) {
      return false;
    }
    // 2. Busca
    if (
      searchQuery &&
      !game.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !game.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // 3. Apenas Favoritos
    if (showFavoritesOnly && !favorites.includes(game.id)) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header Superior */}
      <header className="glass-panel w-full py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 z-20 border-b border-purple-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            G
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wider">
            GRIV JOGOS
          </h1>
        </div>

        {/* Busca e Filtro Rápido */}
        <div className="flex flex-1 max-w-md w-full items-center gap-2">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar jogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-purple-900/50 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 placeholder-purple-300/40 transition-all text-white"
            />
            <span className="absolute right-3 top-2.5 text-purple-400/60">
              🔍
            </span>
          </div>
        </div>

        {/* Menu Administrativo & Links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowFavoritesOnly(!showFavoritesOnly);
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              showFavoritesOnly
                ? "bg-gradient-to-r from-pink-500 to-purple-600 border-transparent shadow-[0_0_10px_rgba(236,72,153,0.3)] text-white"
                : "bg-slate-950/40 border-purple-900/40 text-purple-300 hover:bg-slate-900/60 hover:text-white"
            }`}
          >
            ❤️ Meus Favoritos ({favorites.length})
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 transition-all duration-200"
          >
            Painel Admin ⚙️
          </Link>
        </div>
      </header>

      {/* Categorias Barra Lateral/Superior */}
      <nav className="w-full py-3 px-6 md:px-12 flex gap-2 overflow-x-auto whitespace-nowrap bg-purple-950/10 border-b border-purple-950/20">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setShowFavoritesOnly(false);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
            !selectedCategory && !showFavoritesOnly
              ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
              : "bg-purple-950/20 border border-purple-900/30 text-purple-200 hover:bg-purple-900/40"
          }`}
        >
          Todos os Jogos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.slug);
              setShowFavoritesOnly(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              selectedCategory === cat.slug
                ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                : "bg-purple-950/20 border border-purple-900/30 text-purple-200 hover:bg-purple-900/40"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Grid Principal estilo Friv */}
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
            <p className="text-purple-300 font-semibold animate-pulse">Carregando portal de jogos...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center max-w-md p-8 glass-panel rounded-2xl border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-2">Nenhum jogo cadastrado</h3>
            <p className="text-purple-300 mb-6 text-sm">
              Para começar a jogar, acesse o setup inicial para criar as categorias padrão e a conta do administrador.
            </p>
            <Link
              href="/api/auth/setup"
              target="_blank"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white hover:opacity-90 shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all"
            >
              🚀 Executar Setup Inicial
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-7xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3 auto-rows-max relative">
            
            {/* ITENS DE JOGO (MOSAICO) */}
            {filteredGames.map((game, index) => {
              const glowClass = borderGlowClasses[index % borderGlowClasses.length];
              const isFavorite = favorites.includes(game.id);

              return (
                <Link
                  key={game.id}
                  href={`/jogo/${game.slug}`}
                  className={`relative aspect-square w-full rounded-xl overflow-hidden border-2 bg-slate-950/80 game-cell-hover cursor-pointer shadow-lg flex items-center justify-center group ${glowClass}`}
                >
                  {/* Ícone de favorito no canto superior */}
                  {isFavorite && (
                    <span className="absolute top-1.5 right-1.5 text-xs text-red-500 drop-shadow-md z-10 animate-pulse">
                      ❤️
                    </span>
                  )}
                  {/* Miniatura do Jogo */}
                  <Image
                    src={game.imageUrl}
                    alt={game.title}
                    fill
                    sizes="(max-width: 640px) 33vw, 15vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  {/* Nome do jogo visível em hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                    <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                      {game.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="glass-panel w-full py-4 text-center text-xs text-purple-400/60 mt-auto border-t border-purple-900/20">
        <p>© 2026 GRiv Jogos. Desenvolvido para rodar os melhores clássicos Flash via Ruffle Web Emulator.</p>
      </footer>
    </div>
  );
}
