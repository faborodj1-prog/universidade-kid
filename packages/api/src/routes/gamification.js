const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middlewares/auth");
const { LEVELS } = require("../services/xpEngine");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/gamification/ranking?scope=global&region=SP
router.get("/ranking", authenticate, async (req, res) => {
  const { scope = "global", region } = req.query;
  try {
    const where = { isActive: true };
    if (scope === "region") where.region = region || req.user.region;

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, region: true, role: true, xp: true, level: true, avatarUrl: true },
      orderBy: { xp: "desc" },
      take: 50,
    });

    const ranked = users.map((u, i) => ({
      ...u,
      rank: i + 1,
      levelName: LEVELS.find((l) => l.level === u.level)?.name || "Aprendiz",
      isCurrentUser: u.id === req.user.id,
    }));

    const myRank = ranked.findIndex((u) => u.id === req.user.id);
    const me = myRank >= 0 ? ranked[myRank] : null;
    const top10 = ranked.slice(0, 10);

    res.json({ top10, myRank: myRank + 1, me, total: users.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar ranking" });
  }
});

// GET /api/gamification/my-stats
router.get("/my-stats", authenticate, async (req, res) => {
  try {
    const [user, achievements, xpLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { xp: true, level: true },
      }),
      prisma.achievement.findMany({ where: { userId: req.user.id }, orderBy: { awardedAt: "desc" } }),
      prisma.xPLog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const currentLevel = LEVELS.find((l) => l.level === user.level) || LEVELS[0];
    const nextLevel = LEVELS.find((l) => l.level === user.level + 1);
    const xpToNext = nextLevel ? nextLevel.minXP - user.xp : 0;

    res.json({ xp: user.xp, level: user.level, currentLevel, nextLevel, xpToNext, achievements, xpLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

module.exports = router;
