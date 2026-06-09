import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// GET /api/categories - Retorna todas as categorias
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { games: true },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Erro ao obter categorias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Cria uma nova categoria
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "O nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // Verificar se já existe
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome ou slug" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao criar categoria" },
      { status: 500 }
    );
  }
}
