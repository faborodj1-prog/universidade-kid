const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middlewares/auth");
const { awardXP, checkAchievements } = require("../services/xpEngine");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/progress/start — marca módulo como em andamento
router.post("/start", authenticate, async (req, res) => {
  const { moduleId } = req.body;
  if (!moduleId) return res.status(400).json({ error: "moduleId obrigatório" });
  try {
    const progress = await prisma.userProgress.upsert({
      where: { userId_moduleId: { userId: req.user.id, moduleId } },
      update: { status: "IN_PROGRESS" },
      create: { userId: req.user.id, moduleId, status: "IN_PROGRESS" },
    });
    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar progresso" });
  }
});

// POST /api/progress/complete — marca módulo como concluído
router.post("/complete", authenticate, async (req, res) => {
  const { moduleId, score } = req.body;
  if (!moduleId) return res.status(400).json({ error: "moduleId obrigatório" });
  try {
    const existing = await prisma.userProgress.findUnique({
      where: { userId_moduleId: { userId: req.user.id, moduleId } },
    });

    if (existing?.status === "COMPLETED") {
      return res.json({ progress: existing, xpEarned: 0, alreadyCompleted: true });
    }

    const progress = await prisma.userProgress.upsert({
      where: { userId_moduleId: { userId: req.user.id, moduleId } },
      update: { status: "COMPLETED", score, completedAt: new Date(), attempts: { increment: 1 } },
      create: { userId: req.user.id, moduleId, status: "COMPLETED", score, completedAt: new Date(), attempts: 1 },
    });

    let xpEarned = 0;
    await awardXP(req.user.id, "MODULE_COMPLETED", moduleId);
    xpEarned += 50;

    if (score != null) {
      if (score === 100) {
        await awardXP(req.user.id, "QUIZ_PERFECT", moduleId);
        xpEarned += 60;
      } else if (score >= 80) {
        await awardXP(req.user.id, "QUIZ_PASS", moduleId);
        xpEarned += 30;
      }
    }

    const achievements = await checkAchievements(req.user.id);

    // Verifica se toda a trilha foi concluída para emitir certificado
    const module = await prisma.module.findUnique({ where: { id: moduleId }, select: { trailId: true } });
    let certificateCode = null;
    if (module) {
      const allModules = await prisma.module.findMany({ where: { trailId: module.trailId }, select: { id: true } });
      const allProgress = await prisma.userProgress.findMany({
        where: { userId: req.user.id, moduleId: { in: allModules.map((m) => m.id) } },
      });
      const allDone = allModules.every((m) => allProgress.find((p) => p.moduleId === m.id && p.status === "COMPLETED"));

      if (allDone) {
        const existing = await prisma.certificate.findFirst({ where: { userId: req.user.id, trailId: module.trailId } });
        if (!existing) {
          const { nanoid } = require("nanoid");
          const trail = await prisma.trail.findUnique({ where: { id: module.trailId } });
          const cert = await prisma.certificate.create({
            data: {
              userId: req.user.id,
              trailId: module.trailId,
              trailTitle: trail.title,
              code: nanoid(10).toUpperCase(),
            },
          });
          await awardXP(req.user.id, "CERTIFICATE", cert.id);
          xpEarned += 200;
          certificateCode = cert.code;
        }
      }
    }

    res.json({ progress, xpEarned, achievements, certificateCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao completar módulo" });
  }
});

// GET /api/progress/my — resumo do progresso do usuário
router.get("/my", authenticate, async (req, res) => {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: req.user.id },
      include: { module: { include: { trail: { select: { id: true, title: true } } } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar progresso" });
  }
});

module.exports = router;
