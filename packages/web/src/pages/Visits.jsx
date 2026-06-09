import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import CameraCapture from "../components/CameraCapture";
import { XPGain } from "../components/XPBadge";

const CATEGORIES = [
  { value: "TRAINING", label: "Treinamento", emoji: "📚" },
  { value: "AUDIT", label: "Auditoria de gôndola", emoji: "🔍" },
  { value: "OPENING", label: "Inauguração", emoji: "🎉" },
  { value: "ROUTINE", label: "Visita de rotina", emoji: "🔄" },
];

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocalização não suportada"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Não foi possível obter localização"))
    );
  });
}

export default function Visits() {
  const [showCamera, setShowCamera] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeName: "", category: "ROUTINE", notes: "", photoUrl: "" });
  const [locError, setLocError] = useState(null);
  const [xpGain, setXpGain] = useState(null);
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useQuery({
    queryKey: ["visits-my"],
    queryFn: () => api.get("/visits/my").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const location = await getLocation().catch(() => ({ latitude: 0, longitude: 0 }));
      return api.post("/visits", { ...data, ...location });
    },
    onSuccess: (res) => {
      setXpGain(res.data.xpEarned);
      setShowForm(false);
      setForm({ storeName: "", category: "ROUTINE", notes: "", photoUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["visits-my"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    },
  });

  function handleCapture(url) {
    setForm((f) => ({ ...f, photoUrl: url }));
    setShowCamera(false);
    setShowForm(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.photoUrl) return alert("Foto obrigatória.");
    mutation.mutate(form);
  }

  const dateStr = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Visitas de Campo</h2>
        <button
          onClick={() => setShowCamera(true)}
          className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl touch-btn flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nova visita
        </button>
      </div>

      {xpGain > 0 && (
        <div className="card p-4 bg-green-50 border-green-200 flex items-center justify-center gap-2">
          <XPGain amount={xpGain} />
          <span className="text-sm text-green-700 font-medium">Visita registrada!</span>
        </div>
      )}

      {/* Lista de visitas */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : visits?.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">📸</p>
          <p className="font-medium">Nenhuma visita registrada ainda.</p>
          <p className="text-sm mt-1">Clique em "Nova visita" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits?.map((v) => {
            const cat = CATEGORIES.find((c) => c.value === v.category);
            return (
              <div key={v.id} className="card overflow-hidden">
                <img src={v.photoUrl} alt={v.storeName} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{v.storeName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{dateStr(v.visitedAt)}</p>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      {cat?.emoji} {cat?.label}
                    </span>
                  </div>
                  {v.notes && <p className="text-xs text-gray-500 mt-2">{v.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal câmera */}
      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}

      {/* Modal formulário pós-foto */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg">Detalhes da visita</h3>

            {form.photoUrl && (
              <img src={form.photoUrl} alt="Foto" className="w-full h-40 object-cover rounded-xl" />
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da loja *</label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: Loja ABC"
                  value={form.storeName}
                  onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de visita</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                      className={`p-3 rounded-xl border text-sm font-medium text-left touch-btn
                        ${form.category === c.value ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Notas adicionais..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-2xl font-medium touch-btn">
                  Cancelar
                </button>
                <button type="submit" disabled={mutation.isPending}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold touch-btn disabled:opacity-50">
                  {mutation.isPending ? "Salvando..." : "Salvar visita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
