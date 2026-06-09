import { useRef, useState, useCallback } from "react";

/**
 * CameraCapture — componente mobile-first
 * Prioridade 1: câmera direta via MediaDevices API (WebRTC)
 * Prioridade 2: upload da galeria do celular
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("idle"); // idle | camera | preview
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- Abre câmera traseira diretamente ---
  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMode("camera");
    } catch (err) {
      // Fallback: sem permissão ou sem câmera → abre galeria
      if (err.name === "NotAllowedError") {
        setError("Permissão de câmera negada. Selecione uma foto da galeria.");
      } else if (err.name === "NotFoundError") {
        setError("Câmera não encontrada. Selecione uma foto da galeria.");
      } else {
        setError("Não foi possível acessar a câmera. Use a galeria.");
      }
    }
  }, []);

  // --- Para o stream da câmera ---
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // --- Captura o frame atual do vídeo ---
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const MAX_WIDTH = 1200;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        setPreview({ url, blob });
        setMode("preview");
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  }, [stopCamera]);

  // --- Upload da galeria (fallback) ---
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Comprime via canvas antes de enviar
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            const url = URL.createObjectURL(blob);
            setPreview({ url, blob });
            setMode("preview");
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // --- Envia foto para o servidor ---
  const uploadPhoto = useCallback(async () => {
    if (!preview?.blob) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", preview.blob, `visit-${Date.now()}.jpg`);

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: form,
      });

      if (!res.ok) throw new Error("Falha no upload");
      const data = await res.json();
      onCapture(data.url); // devolve URL do Cloudinary
    } catch (err) {
      setError("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }, [preview, onCapture]);

  // --- Descarta e reinicia ---
  const reset = useCallback(() => {
    stopCamera();
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setMode("idle");
    setError(null);
  }, [preview, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Canvas oculto para processamento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TELA INICIAL */}
      {mode === "idle" && (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
          <p className="text-white text-center text-lg font-medium">
            Registrar foto da visita
          </p>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/30 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          {/* Botão principal — câmera */}
          <button
            onClick={openCamera}
            className="w-full max-w-xs bg-red-600 text-white text-base font-semibold
                       py-4 rounded-2xl flex items-center justify-center gap-3
                       active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Tirar foto agora
          </button>

          {/* Botão secundário — galeria */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs border border-white/30 text-white text-base
                       py-4 rounded-2xl flex items-center justify-center gap-3
                       active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Escolher da galeria
          </button>

          {/* Input file oculto — abre galeria, sugere câmera no mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button onClick={onClose} className="text-white/50 text-sm mt-4">
            Cancelar
          </button>
        </div>
      )}

      {/* VIEWFINDER DA CÂMERA */}
      {mode === "camera" && (
        <div className="flex flex-col h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 object-cover w-full"
          />
          <div className="flex items-center justify-around p-6 bg-black">
            <button
              onClick={() => { stopCamera(); setMode("idle"); }}
              className="text-white/60 text-sm"
            >
              Cancelar
            </button>
            {/* Botão disparador */}
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/50
                         active:scale-90 transition-transform"
              aria-label="Tirar foto"
            />
            {/* Placeholder para simetria */}
            <div className="w-12" />
          </div>
        </div>
      )}

      {/* PREVIEW + CONFIRMAR */}
      {mode === "preview" && preview && (
        <div className="flex flex-col h-full">
          <img
            src={preview.url}
            alt="Preview da foto"
            className="flex-1 object-cover w-full"
          />
          <div className="flex gap-3 p-5 bg-black">
            <button
              onClick={reset}
              disabled={uploading}
              className="flex-1 border border-white/30 text-white py-4 rounded-2xl
                         text-base font-medium active:scale-95 transition-transform
                         disabled:opacity-50"
            >
              Refazer
            </button>
            <button
              onClick={uploadPhoto}
              disabled={uploading}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl text-base
                         font-semibold active:scale-95 transition-transform
                         disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                "Usar esta foto"
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center p-3 bg-black">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
