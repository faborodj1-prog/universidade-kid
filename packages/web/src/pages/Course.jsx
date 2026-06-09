import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { XPGain } from "../components/XPBadge";

function VideoPlayer({ url }) {
  const isYoutube = url?.includes("youtube.com") || url?.includes("youtu.be");
  if (isYoutube) {
    const embedUrl = url.replace("watch?v=", "embed/");
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
        <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Vídeo da aula" />
      </div>
    );
  }
  return (
    <video controls className="w-full rounded-xl" playsInline preload="metadata">
      <source src={url} />
    </video>
  );
}

function QuizView({ questions, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? Math.round((questions.filter((q, i) => answers[i] === q.answer).length / questions.length) * 100)
    : null;

  function submit() {
    if (Object.keys(answers).length < questions.length) {
      alert("Responda todas as questões antes de confirmar.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className={`card p-6 text-center ${score >= 80 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className="text-4xl font-bold">{score}%</p>
          <p className={`font-semibold mt-1 ${score >= 80 ? "text-green-700" : "text-red-700"}`}>
            {score === 100 ? "Perfeito! 🎉" : score >= 80 ? "Aprovado! ✅" : "Tente novamente 📚"}
          </p>
        </div>
        <button onClick={() => onComplete(score)} className="w-full bg-red-600 text-white font-semibold py-4 rounded-2xl touch-btn">
          {score >= 80 ? "Continuar" : "Refazer quiz"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="card p-4">
          <p className="font-semibold text-gray-900 mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, j) => (
              <button
                key={j}
                onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all touch-btn
                  ${answers[i] === j ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-700"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submit} className="w-full bg-red-600 text-white font-semibold py-4 rounded-2xl touch-btn">
        Confirmar respostas
      </button>
    </div>
  );
}

export default function Course() {
  const { trailId, moduleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [xpGain, setXpGain] = useState(null);

  const { data: trail } = useQuery({
    queryKey: ["trail", trailId],
    queryFn: () => api.get(`/trails/${trailId}`).then((r) => r.data),
  });

  const mod = trail?.modules?.find((m) => m.id === moduleId);

  const startMutation = useMutation({
    mutationFn: () => api.post("/progress/start", { moduleId }),
  });

  const completeMutation = useMutation({
    mutationFn: (score) => api.post("/progress/complete", { moduleId, score }),
    onSuccess: (res) => {
      const { xpEarned, certificateCode } = res.data;
      setXpGain(xpEarned);
      queryClient.invalidateQueries({ queryKey: ["trail", trailId] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      setTimeout(() => {
        if (certificateCode) {
          alert(`🎓 Trilha concluída! Certificado emitido: ${certificateCode}`);
        }
        navigate(`/trails/${trailId}`);
      }, 1500);
    },
  });

  if (!mod) return (
    <div className="p-4 animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="aspect-video bg-gray-100 rounded-xl" />
    </div>
  );

  const alreadyCompleted = mod.progress?.status === "COMPLETED";

  function handleStart() {
    if (mod.progress?.status === "NOT_STARTED") {
      startMutation.mutate();
    }
  }

  function handleComplete(score) {
    completeMutation.mutate(score ?? null);
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{mod.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{mod.durationMin} min · ⚡ {mod.xpReward} XP</p>
      </div>

      {xpGain > 0 && (
        <div className="card p-4 flex items-center justify-center gap-2 bg-green-50 border-green-200">
          <XPGain amount={xpGain} />
          <span className="text-sm text-green-700 font-medium">Módulo concluído!</span>
        </div>
      )}

      {/* Conteúdo */}
      <div onClick={handleStart}>
        {mod.contentType === "VIDEO" && <VideoPlayer url={mod.contentUrl} />}
        {mod.contentType === "TEXT" && (
          <div className="card p-5 prose prose-sm max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{mod.contentUrl || "Conteúdo em breve."}</p>
          </div>
        )}
        {mod.contentType === "PDF" && mod.contentUrl && (
          <div className="card p-4 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="font-medium text-gray-900">Material em PDF</p>
              <a href={mod.contentUrl} target="_blank" rel="noreferrer"
                className="text-sm text-red-600 font-medium">
                Abrir PDF ↗
              </a>
            </div>
          </div>
        )}
        {mod.contentType === "QUIZ" && mod.quizzes?.length > 0 && (
          <QuizView questions={mod.quizzes} onComplete={handleComplete} />
        )}
      </div>

      {/* Botão concluir (para não-quiz) */}
      {mod.contentType !== "QUIZ" && !alreadyCompleted && (
        <button
          onClick={() => handleComplete(null)}
          disabled={completeMutation.isPending}
          className="w-full bg-red-600 text-white font-semibold py-4 rounded-2xl touch-btn disabled:opacity-50"
        >
          {completeMutation.isPending ? "Salvando..." : "Marcar como concluído ✓"}
        </button>
      )}

      {alreadyCompleted && (
        <div className="card p-4 bg-green-50 border-green-200 text-center text-green-700 font-medium text-sm">
          ✅ Módulo já concluído
        </div>
      )}
    </div>
  );
}
