import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { XPBadge } from "../components/XPBadge";
import useAppStore from "../store/useAppStore";

const medals = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const user = useAppStore((s) => s.user);
  const [scope, setScope] = useState("global");

  const { data, isLoading } = useQuery({
    queryKey: ["ranking", scope],
    queryFn: () => api.get(`/gamification/ranking?scope=${scope}`).then((r) => r.data),
  });

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Ranking</h2>

      {/* Escopo */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {["global", "region"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${scope === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            {s === "global" ? "🌎 Geral" : "📍 Minha região"}
          </button>
        ))}
      </div>

      {/* Minha posição */}
      {data?.me && (
        <div className="card p-4 border-2 border-red-200 bg-red-50">
          <p className="text-xs font-semibold text-red-500 mb-2">SUA POSIÇÃO</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-red-600 w-8 text-center">#{data.myRank}</span>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600 flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{data.me.name}</p>
              <XPBadge xp={data.me.xp} level={data.me.level} />
            </div>
          </div>
        </div>
      )}

      {/* Top 10 */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">Top 10</h3>
          {data?.top10?.map((u, idx) => (
            <div key={u.id} className={`card p-4 flex items-center gap-3 ${u.isCurrentUser ? "border-red-200 bg-red-50/50" : ""}`}>
              <span className="text-xl w-8 text-center flex-shrink-0">
                {idx < 3 ? medals[idx] : <span className="text-gray-500 font-bold text-sm">#{idx + 1}</span>}
              </span>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 flex-shrink-0 text-sm">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${u.isCurrentUser ? "text-red-700" : "text-gray-900"}`}>
                  {u.name} {u.isCurrentUser && "(você)"}
                </p>
                <p className="text-xs text-gray-400">{u.region || "—"} · {u.levelName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 text-sm">{u.xp.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
