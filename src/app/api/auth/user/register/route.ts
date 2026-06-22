import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Nome de usuário já está em uso" },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const sessionToken = signSession({
      id: user.id,
      username: user.username,
      role: "user",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    response.cookies.set({
      name: "user_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor durante o registro" },
      { status: 500 }
    );
  }
}
