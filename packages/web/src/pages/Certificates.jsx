import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

export default function Certificates() {
  const { data: certs, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => api.get("/certificates/my").then((r) => r.data),
  });

  function download(cert) {
    window.open(`/api/certificates/${cert.id}/download`, "_blank");
  }

  const dateStr = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Meus Certificados</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : certs?.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🎓</p>
          <p className="font-semibold">Nenhum certificado ainda.</p>
          <p className="text-sm mt-1">Conclua uma trilha completa para ganhar seu certificado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certs?.map((cert) => (
            <div key={cert.id} className="card overflow-hidden">
              {/* Banner */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
                <p className="text-3xl mb-1">🎓</p>
                <p className="font-bold text-lg">{cert.trailTitle}</p>
                <p className="text-red-100 text-sm mt-0.5">Certificado de Conclusão</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Emitido em</span>
                  <span className="font-medium text-gray-900">{dateStr(cert.issuedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Código</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">
                    {cert.code}
                  </span>
                </div>
                <button
                  onClick={() => download(cert)}
                  className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl touch-btn flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Baixar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
