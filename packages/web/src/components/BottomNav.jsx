import { NavLink } from "react-router-dom";
import useAppStore from "../store/useAppStore";

const navItems = [
  {
    to: "/", label: "Início", exact: true,
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? "text-kid-red" : "text-gray-400"}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: "/trails", label: "Trilhas",
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? "text-kid-red" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    to: "/visits", label: "Visitas",
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? "text-kid-red" : "text-gray-400"}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    to: "/ranking", label: "Ranking",
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? "text-kid-red" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/>
      </svg>
    ),
  },
  {
    to: "/certificates", label: "Certs",
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? "text-kid-red" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const user = useAppStore((s) => s.user);
  const items = ["ADMIN", "MANAGER"].includes(user?.role)
    ? [...navItems, { to: "/reports", label: "Relatórios", icon: (a) => (
        <svg className={`w-6 h-6 ${a ? "text-kid-red" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ) }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-screen-lg mx-auto flex justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className="flex flex-col items-center py-2 px-3 min-w-[44px] min-h-[44px] justify-center"
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? "text-kid-red" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
