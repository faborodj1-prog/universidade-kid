import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import useAppStore from "../store/useAppStore";

export default function Login() {
  const [tab, setTab] = useState("login");
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(to bottom, #FF6600, #CC4400)" }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 text-white">
        <img
          src="/kidy-logo.jpg"
          alt="Kidy"
          className="w-72 max-w-full object-contain drop-shadow-xl mb-2"
        />
        <p className="text-orange-100 mt-1 text-sm font-medium tracking-wide">
          Universidade Kidy — Treinamento e Certificação
        </p>
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] bg-white"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-4 rounded-2xl disabled:opacity-60 touch-btn mt-2"
            style={{ backgroundColor: "#FF6600" }}
          >
            {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
