const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireRole } = require("../middlewares/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trails — lista trilhas do perfil do usuário
router.get("/", authenticate, async (req, res) => {
  try {
    const trails = await prisma.trail.findMany({
      where: {
        isPublished: true,
        profileTypes: { has: req.user.role },
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true, contentType: true, durationMin: true, xpReward: true },
        },
      },
      orderBy: { order: "asc" },
    });

    // Adiciona progresso do usuário
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: req.user.id },
    });
    const progressMap = Object.fromEntries(userProgress.map((p) => [p.moduleId, p]));

    const enriched = trails.map((trail) => {
      const total = trail.modules.length;
      const done = trail.modules.filter((m) => progressMap[m.id]?.status === "COMPLETED").length;
      return {
        ...trail,
        modules: trail.modules.map((m) => ({
          ...m,
          progress: progressMap[m.id] || { status: "NOT_STARTED" },
        })),
        progressPct: total ? Math.round((done / total) * 100) : 0,
        completedModules: done,
        totalModules: total,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar trilhas" });
  }
});

// GET /api/trails/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const trail = await prisma.trail.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { quizzes: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!trail) return res.status(404).json({ error: "Trilha não encontrada" });

    const userProgress = await prisma.userProgress.findMany({
      where: { userId: req.user.id, module: { trailId: req.params.id } },
    });
    const progressMap = Object.fromEntries(userProgress.map((p) => [p.moduleId, p]));

    res.json({
      ...trail,
      modules: trail.modules.map((m) => ({
        ...m,
        progress: progressMap[m.id] || { status: "NOT_STARTED" },
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar trilha" });
  }
});

// POST /api/trails — admin cria trilha
router.post("/", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const { title, description, profileTypes, thumbnail, order } = req.body;
  try {
    const trail = await prisma.trail.create({
      data: { title, description, profileTypes, thumbnail, order: order || 0 },
    });
    res.status(201).json(trail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar trilha" });
  }
});

// POST /api/trails/:id/modules — admin adiciona módulo
router.post("/:id/modules", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const { title, description, contentType, contentUrl, durationMin, xpReward, order } = req.body;
  try {
    const module = await prisma.module.create({
      data: {
        trailId: req.params.id,
        title, description, contentType, contentUrl,
        durationMin: durationMin || 5,
        xpReward: xpReward || 50,
        order: order || 0,
      },
    });
    res.status(201).json(module);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar módulo" });
  }
});

// POST /api/trails/:trailId/modules/:moduleId/quizzes — admin adiciona questão
router.post("/:trailId/modules/:moduleId/quizzes", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const { question, options, answer, order } = req.body;
  try {
    const quiz = await prisma.quiz.create({
      data: { moduleId: req.params.moduleId, question, options, answer, order: order || 0 },
    });
    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar questão" });
  }
});

module.exports = router;
