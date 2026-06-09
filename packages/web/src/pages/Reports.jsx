import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import api from "../api/client";

function Stat({ label, value, icon, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Reports() {
  const { data: summary, isLoading: loadSum } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => api.get("/reports/summary").then((r) => r.data),
  });

  const { data: team, isLoading: loadTeam } = useQuery({
    queryKey: ["reports-team"],
    queryFn: () => api.get("/reports/team").then((r) => r.data),
  });

  const visitData = summary
    ? Object.entries(summary.visitsByDay).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        visitas: count,
      }))
    : [];

  const trailData = summary?.trails?.slice(0, 6).map((t) => ({
    name: t.title.length > 14 ? t.title.slice(0, 14) + "…" : t.title,
    conclusoes: t.completions,
  })) || [];

  const roles = { SELLER: "Vendedor", RETAILER: "Lojista", REPRESENTATIVE: "Repr.", MANAGER: "Gestor", ADMIN: "Admin" };

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Dashboard Gerencial</h2>

      {/* KPIs */}
      {loadSum ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Usuários ativos" value={summary?.activeUsers} icon="👥" sub={`de ${summary?.totalUsers} cadastros`} />
          <Stat label="Visitas totais" value={summary?.totalVisits} icon="📸" />
          <Stat label="Certificados" value={summary?.totalCerts} icon="🎓" />
          <Stat label="Trilhas publicadas" value={summary?.trails?.length} icon="📚" />
        </div>
      )}

      {/* Visitas por dia */}
      {visitData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Visitas — últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={visitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visitas" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conclusões por trilha */}
      {trailData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Conclusões por trilha</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trailData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="conclusoes" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela da equipe */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Equipe</h3>
        </div>
        {loadTeam ? (
          <div className="p-4 animate-pulse space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-2 font-medium">Nome</th>
                  <th className="text-center px-2 py-2 font-medium">XP</th>
                  <th className="text-center px-2 py-2 font-medium">Módulos</th>
                  <th className="text-center px-2 py-2 font-medium">Visitas</th>
                  <th className="text-center px-2 py-2 font-medium">Certs</th>
                </tr>
              </thead>
              <tbody>
                {team?.slice(0, 20).map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">{u.name}</p>
                      <p className="text-xs text-gray-400">{roles[u.role]} · {u.region || "—"}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold text-gray-700">{u.xp}</td>
                    <td className="px-2 py-2.5 text-center text-gray-600">{u.modulesCompleted}</td>
                    <td className="px-2 py-2.5 text-center text-gray-600">{u.visitsCount}</td>
                    <td className="px-2 py-2.5 text-center text-gray-600">{u.certificatesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
