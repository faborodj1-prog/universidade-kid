import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import ProgressBar from "../components/ProgressBar";

const statusColor = { NOT_STARTED: "bg-gray-100 text-gray-500", IN_PROGRESS: "bg-blue-100 text-blue-600", COMPLETED: "bg-green-100 text-green-600" };
const statusLabel = { NOT_STARTED: "Não iniciado", IN_PROGRESS: "Em andamento", COMPLETED: "Concluído" };
const typeIcon = { VIDEO: "▶️", TEXT: "📄", PDF: "📋", QUIZ: "❓" };

export default function TrailDetail() {
  const { id } = useParams();

  const { data: trail, isLoading } = useQuery({
    queryKey: ["trail", id],
    queryFn: () => api.get(`/trails/${id}`).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-4 animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-2 bg-gray-100 rounded-full w-full" />
    </div>
  );

  if (!trail) return <div className="p-4 text-gray-500">Trilha não encontrada.</div>;

  const done = trail.modules?.filter((m) => m.progress?.status === "COMPLETED").length || 0;
  const total = trail.modules?.length || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="card p-5">
        <h2 className="text-xl font-bold text-gray-900">{trail.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{trail.description}</p>
        <div className="mt-4">
          <ProgressBar pct={pct} label={`${done}/${total} módulos concluídos`} />
        </div>
        {pct === 100 && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium text-center">
            🎉 Trilha concluída! Verifique seus certificados.
          </div>
        )}
      </div>

      {/* Módulos */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800">Módulos</h3>
        {trail.modules?.map((mod, idx) => {
          const status = mod.progress?.status || "NOT_STARTED";
          const prevDone = idx === 0 || trail.modules[idx - 1]?.progress?.status === "COMPLETED";
          const locked = !prevDone && status === "NOT_STARTED";

          return (
            <Link
              key={mod.id}
              to={locked ? "#" : `/trails/${id}/modules/${mod.id}`}
              className={`card p-4 flex items-center gap-3 ${locked ? "opacity-50 pointer-events-none" : "touch-btn"}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                {status === "COMPLETED" ? "✅" : locked ? "🔒" : typeIcon[mod.contentType]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{mod.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[status]}`}>
                    {statusLabel[status]}
                  </span>
                  <span className="text-xs text-gray-400">{mod.durationMin} min · ⚡ {mod.xpReward} XP</span>
                </div>
              </div>
              {!locked && (
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
