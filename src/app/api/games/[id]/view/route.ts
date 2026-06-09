import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o jogo existe por ID ou Slug
    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        views: {
          increment: 1
        }
      },
      select: {
        id: true,
        title: true,
        views: true
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("Erro ao incrementar visualizações:", error);
    return NextResponse.json(
      { error: "Erro ao registrar visualização" },
      { status: 500 }
    );
  }
}
