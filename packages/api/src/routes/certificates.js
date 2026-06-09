const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middlewares/auth");
const { generateCertificatePDF } = require("../services/certificateGen");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/certificates/my
router.get("/my", authenticate, async (req, res) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      orderBy: { issuedAt: "desc" },
    });
    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar certificados" });
  }
});

// GET /api/certificates/:id/download — gera e baixa PDF
router.get("/:id/download", authenticate, async (req, res) => {
  try {
    const cert = await prisma.certificate.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!cert) return res.status(404).json({ error: "Certificado não encontrado" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const pdfBuffer = await generateCertificatePDF(user, cert.trailTitle, cert.code, cert.issuedAt);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${cert.code}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar certificado" });
  }
});

// GET /api/certificates/verify/:code — verificação pública
router.get("/verify/:code", async (req, res) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { code: req.params.code },
      include: { user: { select: { name: true } } },
    });
    if (!cert) return res.status(404).json({ valid: false });
    res.json({
      valid: true,
      holder: cert.user.name,
      trail: cert.trailTitle,
      issuedAt: cert.issuedAt,
      code: cert.code,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro na verificação" });
  }
});

module.exports = router;
