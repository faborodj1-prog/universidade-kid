import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";
import useAppStore from "../store/useAppStore";
import ProgressBar from "../components/ProgressBar";
import { XPBadge } from "../components/XPBadge";

function StatCard({ label, value, icon, color = "red" }) {
  const colors = { red: "bg-red-50 text-red-600", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", yellow: "bg-yellow-50 text-yellow-600" };
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAppStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => api.get("/gamification/my-stats").then((r) => r.data),
  });

  const { data: trails } = useQuery({
    queryKey: ["trails"],
    queryFn: () => api.get("/trails").then((r) => r.data),
  });

  const { data: certs } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => api.get("/certificates/my").then((r) => r.data),
  });

  const inProgress = trails?.filter((t) => t.progressPct > 0 && t.progressPct < 100) || [];
  const roles = { SELLER: "Vendedor", RETAILER: "Lojista", REPRESENTATIVE: "Representante", MANAGER: "Gestor", ADMIN: "Administrador" };

  return (
    <div className="p-4 space-y-5">
      {/* Saudação */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Olá,</p>
            <h2 className="text-xl font-bold text-gray-900">{user?.name?.split(" ")[0]} 👋</h2>
            <p className="text-xs text-gray-400 mt-0.5">{roles[user?.role]}</p>
          </div>
          <XPBadge xp={stats?.xp ?? user?.xp} level={stats?.level ?? user?.level} />
        </div>

        {stats && stats.nextLevel && (
          <div className="mt-4">
            <ProgressBar
              pct={Math.round(((stats.xp - stats.currentLevel.minXP) / (stats.nextLevel.minXP - stats.currentLevel.minXP)) * 100)}
              label={`Próximo nível: ${stats.nextLevel.name} (faltam ${stats.xpToNext} XP)`}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="XP acumulado" value={stats?.xp ?? 0} icon="⚡" color="yellow" />
        <StatCard label="Certificados" value={certs?.length ?? 0} icon="🏆" color="green" />
        <StatCard label="Conquistas" value={stats?.achievements?.length ?? 0} icon="🎖️" color="blue" />
        <StatCard label="Nível" value={`${stats?.level ?? 1}`} icon="🌟" color="red" />
      </div>

      {/* Trilhas em andamento */}
      {inProgress.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Continuar aprendendo</h3>
          <div className="space-y-3">
            {inProgress.slice(0, 3).map((t) => (
              <Link key={t.id} to={`/trails/${t.id}`} className="card p-4 block touch-btn">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900 text-sm flex-1">{t.title}</p>
                  <span className="text-xs text-gray-500 ml-2">{t.completedModules}/{t.totalModules}</span>
                </div>
                <ProgressBar pct={t.progressPct} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Conquistas recentes */}
      {stats?.achievements?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Conquistas recentes</h3>
          <div className="flex gap-2 flex-wrap">
            {stats.achievements.slice(0, 6).map((a) => (
              <div key={a.id} className="card px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-1">
                🎖️ {a.description || a.badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atalhos rápidos */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Acesso rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/trails" className="card p-4 flex flex-col items-center text-center gap-2 touch-btn">
            <span className="text-2xl">📚</span>
            <span className="text-sm font-medium text-gray-700">Trilhas</span>
          </Link>
          <Link to="/visits" className="card p-4 flex flex-col items-center text-center gap-2 touch-btn">
            <span className="text-2xl">📸</span>
            <span className="text-sm font-medium text-gray-700">Registrar visita</span>
          </Link>
          <Link to="/ranking" className="card p-4 flex flex-col items-center text-center gap-2 touch-btn">
            <span className="text-2xl">🏅</span>
            <span className="text-sm font-medium text-gray-700">Ranking</span>
          </Link>
          <Link to="/certificates" className="card p-4 flex flex-col items-center text-center gap-2 touch-btn">
            <span className="text-2xl">🎓</span>
            <span className="text-sm font-medium text-gray-700">Certificados</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
