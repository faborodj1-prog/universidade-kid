const LEVELS = [
  { level: 1, name: "Aprendiz", emoji: "🥉", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { level: 2, name: "Profissional", emoji: "🥈", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { level: 3, name: "Expert", emoji: "🥇", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { level: 4, name: "Mestre Kid", emoji: "👑", color: "bg-red-100 text-red-700 border-red-200" },
];

export function XPBadge({ xp, level, size = "sm" }) {
  const lvl = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const isLg = size === "lg";
  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-full font-semibold
      ${lvl.color} ${isLg ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
      <span>{lvl.emoji}</span>
      <span>{lvl.name}</span>
      {xp !== undefined && <span className="opacity-70">· {xp} XP</span>}
    </div>
  );
}

export function XPGain({ amount }) {
  if (!amount) return null;
  return (
    <span className="inline-flex items-center gap-1 text-green-600 font-bold text-sm animate-bounce">
      +{amount} XP
    </span>
  );
}
