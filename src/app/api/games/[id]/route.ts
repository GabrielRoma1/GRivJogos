import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// GET /api/games/[id] - Obter detalhes de um jogo por ID ou Slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const game = await prisma.game.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        category: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("Erro ao buscar jogo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao obter detalhes do jogo" },
      { status: 500 }
    );
  }
}

// PUT /api/games/[id] - Editar jogo existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o jogo existe
    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const gameType = formData.get("gameType") as string | null;
    const gameUrl = formData.get("gameUrl") as string | null;
    const isActiveStr = formData.get("isActive") as string | null;
    const isActive = isActiveStr !== null ? (isActiveStr === "false" ? false : true) : undefined;

    const imageFile = formData.get("image") as File | null;
    const swfFile = formData.get("swf") as File | null;

    const updateData: any = {};

    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title);
    }
    if (description) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;
    if (gameType) updateData.gameType = gameType;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (gameType === "HTML5") {
      updateData.gameUrl = gameUrl;
      updateData.swfFile = null; // Limpar se mudar de SWF para HTML5
    }

    // 1. Atualizar imagem se enviada
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExt = path.extname(imageFile.name) || ".png";
      const fileSlug = updateData.slug || game.slug;
      const fileName = `${fileSlug}-${Date.now()}${fileExt}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "images");

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // Deletar imagem antiga se possível
      if (game.imageUrl) {
        try {
          const oldPath = path.join(process.cwd(), "public", game.imageUrl);
          await unlink(oldPath);
        } catch (e) {
          console.warn("Não foi possível excluir a imagem antiga:", e);
        }
      }

      updateData.imageUrl = `/uploads/images/${fileName}`;
    }

    // 2. Atualizar SWF se enviado e se for tipo SWF
    if (gameType === "SWF" || (!gameType && game.gameType === "SWF")) {
      if (swfFile && swfFile.size > 0) {
        const bytes = await swfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileSlug = updateData.slug || game.slug;
        const fileName = `${fileSlug}-${Date.now()}.swf`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "swfs");

        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Deletar SWF antigo
        if (game.swfFile) {
          try {
            const oldPath = path.join(process.cwd(), "public", game.swfFile);
            await unlink(oldPath);
          } catch (e) {
            console.warn("Não foi possível excluir o SWF antigo:", e);
          }
        }

        updateData.swfFile = `/uploads/swfs/${fileName}`;
        updateData.gameUrl = null; // Limpar se for SWF
      }
    }

    // Atualizar no banco
    const updatedGame = await prisma.game.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("Erro ao atualizar jogo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao atualizar jogo" },
      { status: 500 }
    );
  }
}

// DELETE /api/games/[id] - Excluir jogo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o jogo existe
    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    // Remover arquivos do disco
    if (game.imageUrl) {
      try {
        const filePath = path.join(process.cwd(), "public", game.imageUrl);
        await unlink(filePath);
      } catch (e) {
        console.warn("Não foi possível excluir a imagem do jogo:", e);
      }
    }

    if (game.swfFile) {
      try {
        const filePath = path.join(process.cwd(), "public", game.swfFile);
        await unlink(filePath);
      } catch (e) {
        console.warn("Não foi possível excluir o arquivo SWF do jogo:", e);
      }
    }

    // Deletar do banco
    await prisma.game.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Jogo excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir jogo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir jogo" },
      { status: 500 }
    );
  }
}
