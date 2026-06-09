import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refresh: null,

      setAuth: (user, token, refresh) => {
        localStorage.setItem("kid_token", token);
        localStorage.setItem("kid_refresh", refresh);
        set({ user, token, refresh });
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),

      logout: () => {
        localStorage.removeItem("kid_token");
        localStorage.removeItem("kid_refresh");
        set({ user: null, token: null, refresh: null });
      },
    }),
    { name: "kid-auth", partialize: (s) => ({ user: s.user }) }
  )
);

export default useAppStore;
