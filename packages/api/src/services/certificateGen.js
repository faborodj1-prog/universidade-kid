const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

async function generateCertificatePDF(user, trailTitle, code, issuedAt) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Fundo
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFF8F0");

      // Borda decorativa
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3).stroke("#E53E3E");

      // Logo / Cabeçalho
      doc.fillColor("#E53E3E")
        .fontSize(28).font("Helvetica-Bold")
        .text("UNIVERSIDADE KID", { align: "center" });

      doc.moveDown(0.3);
      doc.fillColor("#555").fontSize(12).font("Helvetica")
        .text("Certificado de Conclusão", { align: "center" });

      // Linha divisória
      doc.moveDown(1);
      doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke("#E53E3E");

      // Nome do usuário
      doc.moveDown(1.5);
      doc.fillColor("#1A202C").fontSize(20).font("Helvetica-Bold")
        .text(user.name.toUpperCase(), { align: "center" });

      doc.moveDown(0.5);
      doc.fillColor("#555").fontSize(12).font("Helvetica")
        .text("concluiu com êxito a trilha de aprendizagem", { align: "center" });

      doc.moveDown(0.8);
      doc.fillColor("#E53E3E").fontSize(16).font("Helvetica-Bold")
        .text(trailTitle, { align: "center" });

      doc.moveDown(1.5);
      const dateStr = new Date(issuedAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      });
      doc.fillColor("#555").fontSize(11).font("Helvetica")
        .text(`Emitido em ${dateStr}`, { align: "center" });

      // QR Code
      const qrData = await QRCode.toDataURL(
        `${process.env.APP_URL || "https://universidade-kid.onrender.com"}/verificar/${code}`,
        { width: 80, margin: 1 }
      );
      const qrBuffer = Buffer.from(qrData.split(",")[1], "base64");

      doc.image(qrBuffer, doc.page.width - 130, doc.page.height - 130, { width: 80 });
      doc.fillColor("#999").fontSize(8)
        .text(`Código: ${code}`, doc.page.width - 145, doc.page.height - 45, { width: 110, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePDF };
