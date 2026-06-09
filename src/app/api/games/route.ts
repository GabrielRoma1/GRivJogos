import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

// GET /api/games - Listar jogos com filtros e buscas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort"); // "views", "newest"
    const activeParam = searchParams.get("active"); // "all" ou "true"

    const where: any = {};

    // Filtro por ativo por padrão
    if (activeParam !== "all") {
      where.isActive = true;
    }

    // Filtro por Categoria
    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    // Busca textual
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Ordenação
    let orderBy: any = { createdAt: "desc" };
    if (sort === "views") {
      orderBy = { views: "desc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const games = await prisma.game.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Erro ao obter jogos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar jogos" },
      { status: 500 }
    );
  }
}

// POST /api/games - Criar um novo jogo (com upload de arquivo)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const gameType = formData.get("gameType") as string; // "SWF" ou "HTML5"
    const gameUrl = formData.get("gameUrl") as string | null;
    const isActiveStr = formData.get("isActive") as string;
    const isActive = isActiveStr === "false" ? false : true;

    const imageFile = formData.get("image") as File | null;
    const swfFile = formData.get("swf") as File | null;

    if (!title || !description || !categoryId || !gameType) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: título, descrição, categoria, tipo de jogo" },
        { status: 400 }
      );
    }

    const slug = slugify(title);

    // Verificar se já existe jogo com o mesmo slug
    const existing = await prisma.game.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe um jogo cadastrado com este título" },
        { status: 400 }
      );
    }

    let imageUrl = "";
    let swfPath = "";

    // 1. Upload do Ícone do Jogo
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Gerar nome único de arquivo
      const fileExt = path.extname(imageFile.name) || ".png";
      const fileName = `${slug}-${Date.now()}${fileExt}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "images");

      // Garantir que a pasta existe
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/images/${fileName}`;
    } else {
      return NextResponse.json(
        { error: "O ícone do jogo é obrigatório" },
        { status: 400 }
      );
    }

    // 2. Upload do arquivo SWF caso o jogo seja do tipo Flash/SWF
    if (gameType === "SWF") {
      if (swfFile && swfFile.size > 0) {
        const bytes = await swfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${slug}-${Date.now()}.swf`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "swfs");

        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        swfPath = `/uploads/swfs/${fileName}`;
      } else {
        return NextResponse.json(
          { error: "O arquivo SWF (.swf) é obrigatório para jogos do tipo SWF" },
          { status: 400 }
        );
      }
    }

    // Salvar no banco
    const game = await prisma.game.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        gameType,
        gameUrl: gameType === "HTML5" ? gameUrl : null,
        swfFile: gameType === "SWF" ? swfPath : null,
        isActive,
        categoryId,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar jogo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao cadastrar jogo" },
      { status: 500 }
    );
  }
}
