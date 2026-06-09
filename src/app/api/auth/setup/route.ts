import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    // Verificar se já existe algum usuário no banco
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        { error: "O sistema já está inicializado. Setup indisponível." },
        { status: 400 }
      );
    }

    const defaultEmail = "admin@grivjogos.com.br";
    const defaultPassword = "admin123";
    const hashedPassword = hashPassword(defaultPassword);

    // Criar administrador padrão
    const admin = await prisma.user.create({
      data: {
        name: "Administrador GRiv",
        email: defaultEmail,
        password: hashedPassword,
        role: "admin",
      },
    });

    // Criar algumas categorias básicas também para facilitar
    const defaultCategories = [
      { name: "Ação", slug: "acao" },
      { name: "Corrida", slug: "corrida" },
      { name: "Luta", slug: "luta" },
      { name: "Esporte", slug: "esporte" },
      { name: "Puzzle", slug: "puzzle" },
      { name: "Aventura", slug: "aventura" },
      { name: "Plataforma", slug: "plataforma" },
      { name: "Tiro", slug: "tiro" },
      { name: "Clássicos Flash", slug: "classicos-flash" },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    return NextResponse.json({
      message: "Sistema inicializado com sucesso!",
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      credentials: {
        email: defaultEmail,
        password: defaultPassword,
        aviso: "RECOMENDADO ALTERAR A SENHA PADRÃO NO PAINEL DE CONTROLE."
      }
    });
  } catch (error: any) {
    console.error("Erro no setup inicial:", error);
    return NextResponse.json(
      { error: "Erro interno ao executar setup", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
