import { Outlet, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import useAppStore from "../store/useAppStore";

export default function Layout() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 safe-top">
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-kid-red font-bold text-lg tracking-tight">Universidade Kidy</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">
              {user?.name?.split(" ")[0]}
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-kid-red font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full pb-24">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
