import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookiesHeader = request.headers.get("cookie");
    const adminUser = getAdminUser(cookiesHeader);

    if (!adminUser) {
      return NextResponse.json(
        { authenticated: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: adminUser,
    });
  } catch (error: any) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      { authenticated: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
