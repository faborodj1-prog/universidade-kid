const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireRole } = require("../middlewares/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/summary — dashboard gestor
router.get("/summary", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalVisits, totalCerts, trailStats] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, xp: { gt: 0 } } }),
      prisma.visit.count(),
      prisma.certificate.count(),
      prisma.trail.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          modules: {
            select: {
              progress: {
                where: { status: "COMPLETED" },
                select: { userId: true },
              },
            },
          },
        },
      }),
    ]);

    const trails = trailStats.map((t) => {
      const completions = new Set();
      t.modules.forEach((m) => m.progress.forEach((p) => completions.add(p.userId)));
      return { id: t.id, title: t.title, completions: completions.size };
    });

    // Visitas últimos 7 dias por dia
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentVisits = await prisma.visit.findMany({
      where: { visitedAt: { gte: sevenDaysAgo } },
      select: { visitedAt: true },
    });

    const visitsByDay = {};
    recentVisits.forEach((v) => {
      const day = v.visitedAt.toISOString().slice(0, 10);
      visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    });

    res.json({ totalUsers, activeUsers, totalVisits, totalCerts, trails, visitsByDay });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

// GET /api/reports/team — progresso por usuário
router.get("/team", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const { region } = req.query;
  try {
    const where = { isActive: true };
    if (region) where.region = region;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        region: true,
        role: true,
        xp: true,
        level: true,
        progress: { where: { status: "COMPLETED" }, select: { id: true } },
        visits: { select: { id: true } },
        certificates: { select: { id: true } },
      },
      orderBy: { xp: "desc" },
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      region: u.region,
      role: u.role,
      xp: u.xp,
      level: u.level,
      modulesCompleted: u.progress.length,
      visitsCount: u.visits.length,
      certificatesCount: u.certificates.length,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar equipe" });
  }
});

module.exports = router;
