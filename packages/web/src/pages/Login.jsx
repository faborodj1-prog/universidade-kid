import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import useAppStore from "../store/useAppStore";

export default function Login() {
  const [tab, setTab] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SELLER", region: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const payload = tab === "login"
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.access, data.refresh);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-800 flex flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-6 text-white">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl">
          <span className="text-4xl">🎓</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Universidade Kidy</h1>
        <p className="text-red-100 mt-1 text-sm">Plataforma de treinamento e certificação</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-safe-bottom">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {t === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {tab === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="SELLER">Vendedor PDV</option>
                  <option value="RETAILER">Lojista</option>
                  <option value="REPRESENTATIVE">Representante</option>
                  <option value="MANAGER">Gestor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Região (opcional)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: SP, RJ, Sul..."
                  value={form.region}
                  onChange={(e) => update("region", e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-semibold py-4 rounded-2xl
                       disabled:opacity-60 touch-btn mt-2"
          >
            {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
