const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@universidadekid.com" },
    update: {},
    create: { name: "Administrador", email: "admin@universidadekid.com", password: adminHash, role: "ADMIN" },
  });
  console.log("Admin criado:", admin.email);

  const trail = await prisma.trail.upsert({
    where: { id: "trail-demo-001" },
    update: {},
    create: {
      id: "trail-demo-001",
      title: "Fundamentos Kidy",
      description: "Trilha introdutória sobre a marca, produtos e técnicas de venda.",
      profileTypes: ["REPRESENTATIVE", "RETAILER", "SELLER"],
      isPublished: true,
      order: 1,
    },
  });

  const modules = [
    { title: "Boas-vindas à Universidade Kidy", contentType: "VIDEO", contentUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationMin: 5, xpReward: 50, order: 1 },
    { title: "Conhecendo a Linha de Produtos", contentType: "TEXT", contentUrl: "", durationMin: 10, xpReward: 50, order: 2 },
    { title: "Quiz: Fundamentos", contentType: "QUIZ", contentUrl: "", durationMin: 5, xpReward: 30, order: 3 },
  ];

  for (const mod of modules) {
    const created = await prisma.module.upsert({
      where: { id: `mod-${trail.id}-${mod.order}` },
      update: {},
      create: { id: `mod-${trail.id}-${mod.order}`, trailId: trail.id, ...mod },
    });

    if (mod.contentType === "QUIZ") {
      await prisma.quiz.createMany({
        skipDuplicates: true,
        data: [
          { moduleId: created.id, question: "Qual o principal diferencial da marca Kidy?", options: ["Preço baixo", "Qualidade e inovação", "Distribuição rápida", "Embalagem colorida"], answer: 1, order: 1 },
          { moduleId: created.id, question: "Quais são os perfis que usam a Universidade Kidy?", options: ["Apenas representantes", "Representantes, lojistas e vendedores", "Só vendedores", "Somente gestores"], answer: 1, order: 2 },
        ],
      });
    }
  }

  console.log("Dados de demonstração criados com sucesso.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
