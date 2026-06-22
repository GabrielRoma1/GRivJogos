import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function getUserId(request: Request) {
  const cookies = request.headers.get("cookie");
  if (!cookies) return null;
  const cookieObj = cookies.split(";").reduce((acc: any, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key) acc[key] = value;
    return acc;
  }, {});
  const sessionToken = cookieObj["user_session"];
  if (!sessionToken) return null;
  const session = verifySession(sessionToken);
  if (!session || session.role !== "user") return null;
  return session.id;
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { gameId } = await request.json();
    if (!gameId) return NextResponse.json({ error: "ID do jogo é obrigatório" }, { status: 400 });

    // Adiciona ao histórico do usuário
    const history = await prisma.history.create({
      data: { userId, gameId },
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar histórico" }, { status: 500 });
  }
}
