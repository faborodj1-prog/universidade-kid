import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import useAppStore from "../store/useAppStore";

export default function Layout() {
  const user = useAppStore((s) => s.user);
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 safe-top">
        <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-kid-red font-bold text-lg tracking-tight">Universidade Kid</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              {user?.name?.split(" ")[0]}
            </span>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-kid-red font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
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
