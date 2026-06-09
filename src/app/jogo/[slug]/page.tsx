"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { use } from "react";

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
    slug: string;
  };
}

export default function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // 1. Carregar detalhes do jogo e incrementar visualização
  useEffect(() => {
    async function loadGameData() {
      try {
        const res = await fetch(`/api/games/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data);
          
          // Incrementar visualização
          fetch(`/api/games/${data.id}/view`, { method: "POST" });
          
          // Verificar se é favorito
          const storedFavs = localStorage.getItem("griv_favorites");
          if (storedFavs) {
            const favList = JSON.parse(storedFavs);
            setIsFavorite(favList.includes(data.id));
          }

          // Carregar relacionados da mesma categoria
          const relatedRes = await fetch(`/api/games?category=${data.category.slug}`);
          if (relatedRes.ok) {
            const relatedData: Game[] = await relatedRes.json();
            // Filtrar o jogo atual
            setRelatedGames(relatedData.filter((g) => g.id !== data.id).slice(0, 6));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar o jogo:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGameData();
  }, [slug]);

  // 2. Carregar emulador Ruffle para jogos SWF
  useEffect(() => {
    if (!game || game.gameType !== "SWF" || typeof window === "undefined") return;

    const scriptId = "ruffle-wasm-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initRuffle = () => {
      const ruffle = (window as any).RufflePlayer?.newest();
      if (!ruffle) return;
      
      const player = ruffle.createPlayer();
      const container = document.getElementById("ruffle-player-container");
      if (container && game.swfFile) {
        container.innerHTML = "";
        container.appendChild(player);
        player.load(game.swfFile);
        player.style.width = "100%";
        player.style.height = "100%";
        // Permitir foco de teclado para o jogo
        player.focus();
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/@ruffle-rs/ruffle";
      script.async = true;
      script.onload = () => {
        initRuffle();
      };
      document.body.appendChild(script);
    } else {
      // Script já inserido, inicializar diretamente
      if ((window as any).RufflePlayer) {
        initRuffle();
      } else {
        script.addEventListener("load", initRuffle);
      }
    }

    return () => {
      const container = document.getElementById("ruffle-player-container");
      if (container) container.innerHTML = "";
    };
  }, [game]);

  // Alternar favorito
  const toggleFavorite = () => {
    if (!game) return;
    const storedFavs = localStorage.getItem("griv_favorites");
    let favList: string[] = storedFavs ? JSON.parse(storedFavs) : [];
    
    if (isFavorite) {
      favList = favList.filter((id) => id !== game.id);
      setIsFavorite(false);
    } else {
      favList.push(game.id);
      setIsFavorite(true);
    }
    localStorage.setItem("griv_favorites", JSON.stringify(favList));
  };

  // Ativar tela cheia
  const handleFullscreen = () => {
    if (viewportRef.current) {
      const elem = viewportRef.current;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
        <p className="text-purple-300 font-semibold mt-3 animate-pulse">Carregando o player do jogo...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-screen text-center p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Jogo não encontrado!</h2>
        <p className="text-purple-300 mb-6">O jogo solicitado não existe ou está inativo no momento.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-purple-900/60 border border-purple-700/50 hover:bg-purple-800 rounded-xl text-white font-semibold transition-all"
        >
          ⬅️ Voltar para a Início
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header do Player */}
      <header className="glass-panel w-full py-4 px-6 md:px-12 flex justify-between items-center z-20 border-b border-purple-900/40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/60 border border-purple-900/50 hover:bg-pink-500 hover:text-white transition-all text-purple-300"
            title="Voltar para a início"
          >
            ⬅️
          </Link>
          <div>
            <span className="text-xs uppercase bg-purple-900/60 border border-purple-700/50 rounded-full px-2.5 py-0.5 font-bold text-cyan-400">
              {game.category.name}
            </span>
            <h1 className="text-xl font-bold text-white leading-tight mt-1">
              {game.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-3 rounded-xl border transition-colors ${
              isFavorite
                ? "bg-red-500/20 border-red-500/50 text-red-500"
                : "bg-slate-900/60 border-purple-900/50 text-purple-300 hover:bg-slate-800 hover:text-red-400"
            }`}
            title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            {isFavorite ? "❤️ Favoritado" : "🤍 Favoritar"}
          </button>
          <button
            onClick={handleFullscreen}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white hover:opacity-90 shadow-md hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all flex items-center gap-2"
          >
            Tela Cheia 📺
          </button>
        </div>
      </header>

      {/* Área Central: Player e Painel Lateral de Info */}
      <main className="flex-1 p-4 md:p-8 flex flex-col xl:flex-row gap-6 max-w-7xl w-full mx-auto justify-center items-stretch">
        
        {/* Container do Jogo (Viewport) */}
        <div className="flex-1 flex flex-col">
          <div
            id="game-viewport"
            ref={viewportRef}
            className="w-full aspect-video md:max-h-[580px] bg-black rounded-2xl overflow-hidden border border-purple-900/50 relative shadow-2xl flex items-center justify-center"
          >
            {game.gameType === "SWF" ? (
              // Player do Ruffle
              <div id="ruffle-player-container" className="w-full h-full" />
            ) : (
              // IFrame para HTML5
              game.gameUrl && (
                <iframe
                  src={game.gameUrl}
                  allow="fullscreen; autoplay; keyboard-map; xr-spatial-tracking"
                  className="w-full h-full border-0 rounded-2xl"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              )
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center text-xs text-purple-400/80 bg-purple-950/10 border border-purple-900/20 rounded-xl px-4 py-2">
            <span>👁️ {game.views} visualizações</span>
            <span>Tipo de motor: <strong className="text-cyan-400 font-semibold">{game.gameType}</strong></span>
          </div>
        </div>

        {/* Descrição e Instruções do Jogo */}
        <div className="w-full xl:w-80 flex flex-col justify-between p-6 glass-panel rounded-2xl border border-purple-900/30 gap-6">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-purple-900/40 pb-2 mb-3">
              Sobre o Jogo
            </h3>
            <p className="text-purple-200 text-sm leading-relaxed whitespace-pre-line">
              {game.description}
            </p>
          </div>

          <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              Dica de Compatibilidade
            </h4>
            <p className="text-[11px] text-purple-300 leading-normal">
              {game.gameType === "SWF" 
                ? "Este jogo roda usando emulador Flash Ruffle. Caso os controles de teclado não respondam, clique dentro da tela do jogo para focar."
                : "Este jogo roda nativamente em HTML5. Caso não carregue ou fique branco, verifique suas permissões de iframe no navegador."}
            </p>
          </div>
        </div>
      </main>

      {/* Seção Jogos Relacionados */}
      {relatedGames.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 border-t border-purple-900/25 mt-8">
          <h3 className="text-lg font-bold text-white mb-6">
            Outros Jogos Relacionados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedGames.map((g) => (
              <Link
                key={g.id}
                href={`/jogo/${g.slug}`}
                className="relative aspect-square w-full rounded-xl overflow-hidden border border-purple-900/40 bg-slate-950 hover:border-pink-500 hover:shadow-md hover:scale-[1.03] transition-all group"
              >
                <Image
                  src={g.imageUrl}
                  alt={g.title}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] font-bold text-white line-clamp-2 leading-none">
                    {g.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="glass-panel w-full py-4 text-center text-xs text-purple-400/60 mt-auto border-t border-purple-900/20">
        <p>© 2026 GRiv Jogos. Emulado via Ruffle em tempo real no seu navegador.</p>
      </footer>
    </div>
  );
}
