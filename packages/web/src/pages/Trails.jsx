import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";
import ProgressBar from "../components/ProgressBar";

const typeLabel = { VIDEO: "Vídeo", TEXT: "Leitura", PDF: "PDF", QUIZ: "Quiz" };
const typeIcon = { VIDEO: "▶️", TEXT: "📄", PDF: "📋", QUIZ: "❓" };

export default function Trails() {
  const { data: trails, isLoading } = useQuery({
    queryKey: ["trails"],
    queryFn: () => api.get("/trails").then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-3" />
          <div className="h-2 bg-gray-100 rounded-full w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Minhas Trilhas</h2>

      {!trails?.length && (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">📚</p>
          <p className="font-medium">Nenhuma trilha disponível ainda.</p>
          <p className="text-sm mt-1">Aguarde a publicação das trilhas pelo admin.</p>
        </div>
      )}

      {trails?.map((trail) => (
        <Link key={trail.id} to={`/trails/${trail.id}`} className="card p-5 block touch-btn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{trail.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{trail.description}</p>
            </div>
            {trail.progressPct === 100 && (
              <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                ✓ Concluída
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
            <span>📦 {trail.totalModules} módulos</span>
            <span>⏱ {trail.modules?.reduce((s, m) => s + m.durationMin, 0)} min</span>
            <span>⚡ {trail.modules?.reduce((s, m) => s + m.xpReward, 0)} XP</span>
          </div>

          <div className="mt-3">
            <ProgressBar pct={trail.progressPct} label={`${trail.completedModules}/${trail.totalModules} concluídos`} size="sm" />
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            {[...new Set(trail.modules?.map((m) => m.contentType))].map((ct) => (
              <span key={ct} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {typeIcon[ct]} {typeLabel[ct]}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
