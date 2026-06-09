const express = require("express");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireRole } = require("../middlewares/auth");
const { awardXP, checkAchievements } = require("../services/xpEngine");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/visits
router.post("/", authenticate, [
  body("storeName").trim().notEmpty(),
  body("latitude").isFloat(),
  body("longitude").isFloat(),
  body("photoUrl").notEmpty(),
  body("category").isIn(["TRAINING", "AUDIT", "OPENING", "ROUTINE"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { storeName, storeId, latitude, longitude, photoUrl, category, checklistAnswers, notes } = req.body;
  try {
    const visit = await prisma.visit.create({
      data: { userId: req.user.id, storeName, storeId, latitude, longitude, photoUrl, category, checklistAnswers, notes },
    });
    await awardXP(req.user.id, "VISIT_WITH_PHOTO", visit.id);
    const achievements = await checkAchievements(req.user.id);
    res.status(201).json({ visit, xpEarned: 40, achievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar visita" });
  }
});

// GET /api/visits/my
router.get("/my", authenticate, async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({
      where: { userId: req.user.id },
      orderBy: { visitedAt: "desc" },
      take: 50,
    });
    res.json(visits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

// GET /api/visits — gestor/admin vê todas
router.get("/", authenticate, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const { region, from, to, page = 1 } = req.query;
  try {
    const where = {};
    if (region) where.user = { region };
    if (from || to) {
      where.visitedAt = {};
      if (from) where.visitedAt.gte = new Date(from);
      if (to) where.visitedAt.lte = new Date(to);
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: { user: { select: { name: true, region: true, role: true } } },
        orderBy: { visitedAt: "desc" },
        take: 20,
        skip: (page - 1) * 20,
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({ visits, total, pages: Math.ceil(total / 20) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

module.exports = router;
