import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "GRiv Jogos — O Melhor Portal de Jogos Online Grátis e Clássicos em Flash",
  description: "Divirta-se jogando os melhores jogos casuais gratuitos e clássicos do Flash no GRiv Jogos! Interface nostálgica inspirada no Friv clássico, dezenas de jogos rápidos e diversão garantida.",
  keywords: "jogos online grátis, friv clássico, griv jogos, jogos flash, ruffle emulador, swf, jogos casuais",
  authors: [{ name: "GRiv Jogos" }],
  openGraph: {
    title: "GRiv Jogos — Portal de Jogos Online estilo Friv Clássico",
    description: "Jogue clássicos em Flash via Ruffle e novos jogos HTML5 em uma interface rápida e nostálgica.",
    type: "website",
    locale: "pt_BR",
    siteName: "GRiv Jogos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full`}>
      <head>
        {/* Favicon e meta tags adicionais se necessário */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased h-full flex flex-col min-h-screen text-slate-100 selection:bg-pink-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
