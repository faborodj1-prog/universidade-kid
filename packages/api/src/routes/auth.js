const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();
const prisma = new PrismaClient();

function signTokens(userId) {
  const access = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refresh = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { access, refresh };
}

// POST /api/auth/register
router.post("/register", [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").optional().isIn(["ADMIN", "MANAGER", "REPRESENTATIVE", "RETAILER", "SELLER"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = "SELLER", region } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "E-mail já cadastrado" });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hash, role, region },
      select: { id: true, name: true, email: true, role: true, region: true, xp: true, level: true },
    });

    const tokens = signTokens(user.id);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /api/auth/login
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

    if (!user.isActive) return res.status(403).json({ error: "Conta desativada" });

    const tokens = signTokens(user.id);
    const { password: _, ...safe } = user;
    res.json({ user: safe, ...tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: "Refresh token obrigatório" });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const tokens = signTokens(payload.sub);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, (req, res) => res.json(req.user));

module.exports = router;
