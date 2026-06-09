const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const XP_TABLE = {
  MODULE_COMPLETED: 50,
  QUIZ_PASS: 30,      // >= 80%
  QUIZ_PERFECT: 60,   // 100%
  CERTIFICATE: 200,
  VISIT_WITH_PHOTO: 40,
  STREAK_7: 100,
};

const LEVELS = [
  { level: 1, name: "Aprendiz",    minXP: 0 },
  { level: 2, name: "Profissional", minXP: 501 },
  { level: 3, name: "Expert",      minXP: 1501 },
  { level: 4, name: "Mestre Kid",  minXP: 3501 },
];

function calcLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i].level;
  }
  return 1;
}

async function awardXP(userId, reason, refId = null) {
  const amount = XP_TABLE[reason];
  if (!amount) return;

  await prisma.$transaction(async (tx) => {
    await tx.xPLog.create({ data: { userId, amount, reason, refId } });
    const user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true },
    });
    const newLevel = calcLevel(user.xp);
    await tx.user.update({ where: { id: userId }, data: { level: newLevel } });
  });
}

async function checkAchievements(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      progress: { where: { status: "COMPLETED" } },
      visits: true,
      certificates: true,
    },
  });

  const earned = [];

  const grant = async (badge, description) => {
    try {
      await prisma.achievement.create({ data: { userId, badge, description } });
      earned.push(badge);
    } catch { /* já possui */ }
  };

  if (user.progress.length >= 1) await grant("FIRST_LESSON", "Primeira aula concluída!");
  if (user.certificates.length >= 5) await grant("FIVE_CERTS", "5 certificados conquistados!");
  if (user.visits.length >= 10) await grant("FIELD_EXPERT", "10 visitas de campo registradas!");
  if (user.xp >= 3501) await grant("MASTER_KID", "Nível Mestre Kid alcançado!");

  return earned;
}

module.exports = { awardXP, checkAchievements, calcLevel, LEVELS, XP_TABLE };
