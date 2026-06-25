import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@memechat/shared';
import { authApi } from '@/lib/api/authApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (displayName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      register: async (displayName, email, password) => {
        try {
          set({ isLoading: true });
          const username = displayName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36);
          const { user, accessToken, refreshToken } = await authApi.register({ username, displayName, email, password });
          set({ user, accessToken, refreshToken, isAuthenticated: true });
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const { user, accessToken, refreshToken } = await authApi.login(email, password);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
        try {
          const { accessToken, user } = await authApi.refresh(refreshToken);
          set({ accessToken, user, isAuthenticated: true, isLoading: false });
          return true;
        } catch {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
        }
      },

      updateUser: (updates) =>
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'memechat-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.accessToken) {
            state.isAuthenticated = true;
            state.isLoading = false;
          } else {
            state.isLoading = false;
          }
        }
      },
    },
  ),
);
