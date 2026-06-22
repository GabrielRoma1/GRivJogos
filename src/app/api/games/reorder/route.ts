import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/games/reorder - Atualizar a ordem de exibição dos jogos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de IDs ordenados é obrigatória" },
        { status: 400 }
      );
    }

    // Atualizar cada jogo com sua nova posição
    const updates = orderedIds.map((id: string, index: number) =>
      prisma.game.update({
        where: { id },
        data: { displayOrder: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Ordem atualizada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao reordenar jogos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao reordenar jogos" },
      { status: 500 }
    );
  }
}
