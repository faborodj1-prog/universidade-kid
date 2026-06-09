import { useRef, useState, useCallback } from "react";
import api from "../api/client";

/**
 * CameraCapture — mobile-first
 * Prioridade 1: câmera ao vivo via WebRTC (live viewfinder)
 * Prioridade 2: seleção da galeria via file input (SEM capture= para não forçar câmera)
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const galleryInputRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("idle"); // idle | camera | preview
  const [preview, setPreview] = useState(null); // { url, blob }
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // --- PRIORIDADE 1: abre câmera traseira via WebRTC ---
  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setMode("camera");
    } catch (err) {
      const msgs = {
        NotAllowedError: "Permissão negada. Tente selecionar da galeria.",
        NotFoundError: "Câmera não encontrada. Selecione da galeria.",
      };
      setError(msgs[err.name] || "Erro ao acessar câmera. Selecione da galeria.");
    }
  }, []);

  // --- Captura frame do vídeo e gera Blob comprimido ---
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const MAX = 1200;
    const scale = Math.min(1, MAX / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setPreview({ url: URL.createObjectURL(blob), blob });
      setMode("preview");
      stopStream();
    }, "image/jpeg", 0.85);
  }, [stopStream]);

  // --- PRIORIDADE 2: galeria — file input SEM capture= (não força câmera) ---
  const handleGallerySelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        const MAX = 1200;
        const scale = Math.min(1, MAX / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          setPreview({ url: URL.createObjectURL(blob), blob });
          setMode("preview");
        }, "image/jpeg", 0.85);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Limpa o input para permitir selecionar a mesma foto novamente
    e.target.value = "";
  }, []);

  const uploadPhoto = useCallback(async () => {
    if (!preview?.blob) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", preview.blob, `visita-${Date.now()}.jpg`);
      const { data } = await api.post("/uploads/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      URL.revokeObjectURL(preview.url);
      onCapture(data.url);
    } catch {
      setError("Falha no envio. Verifique sua conexão e tente novamente.");
    } finally {
      setUploading(false);
    }
  }, [preview, onCapture]);

  const reset = useCallback(() => {
    stopStream();
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setMode("idle");
    setError(null);
  }, [preview, stopStream]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── TELA INICIAL ── */}
      {mode === "idle" && (
        <div className="flex flex-col items-center justify-center h-full gap-5 px-8">
          <div className="text-center">
            <p className="text-white text-lg font-semibold">Registrar foto</p>
            <p className="text-white/50 text-sm mt-1">Escolha como deseja adicionar</p>
          </div>

          {error && (
            <div className="w-full max-w-xs bg-red-900/40 border border-red-700/50 text-red-300 text-sm text-center px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Botão principal — câmera ao vivo */}
          <button
            onClick={openCamera}
            className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-semibold
                       py-4 rounded-2xl flex items-center justify-center gap-3 touch-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Tirar foto agora
          </button>

          {/* Botão secundário — galeria (sem capture=, abre o seletor de arquivos) */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full max-w-xs border border-white/25 text-white font-medium
                       py-4 rounded-2xl flex items-center justify-center gap-3 touch-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Escolher da galeria
          </button>

          {/* Input para galeria — SEM capture="environment" para abrir o seletor real */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            className="hidden"
          />

          <button onClick={onClose} className="text-white/40 text-sm py-2">
            Cancelar
          </button>
        </div>
      )}

      {/* ── VIEWFINDER AO VIVO ── */}
      {mode === "camera" && (
        <div className="flex flex-col h-full">
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover w-full" />
          <div className="flex items-center justify-around p-6 bg-black">
            <button
              onClick={() => { stopStream(); setMode("idle"); }}
              className="text-white/60 text-sm px-4 py-2"
            >
              Voltar
            </button>
            <button
              onClick={capturePhoto}
              className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-full bg-white border-4 border-gray-400 touch-btn"
              aria-label="Capturar foto"
            />
            <div className="w-16" />
          </div>
        </div>
      )}

      {/* ── PREVIEW + CONFIRMAR ── */}
      {mode === "preview" && preview && (
        <div className="flex flex-col h-full">
          <img src={preview.url} alt="Preview" className="flex-1 object-cover w-full" />
          {error && (
            <p className="text-red-400 text-sm text-center px-4 py-2 bg-black/80">{error}</p>
          )}
          <div className="flex gap-3 p-4 bg-black">
            <button
              onClick={reset}
              disabled={uploading}
              className="flex-1 border border-white/25 text-white py-4 rounded-2xl font-medium touch-btn disabled:opacity-40"
            >
              Refazer
            </button>
            <button
              onClick={uploadPhoto}
              disabled={uploading}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold touch-btn disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : "Usar esta foto"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
