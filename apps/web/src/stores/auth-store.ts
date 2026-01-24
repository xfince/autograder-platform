import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // timestamp when access token expires
  isAuthenticated: boolean;
  isRefreshing: boolean;
  isHydrated: boolean; // Track whether store has been hydrated from localStorage

  // Actions
  setAuth: (user: User, token: string, refreshToken: string, expiresIn: number) => void;
  setAccessToken: (token: string, expiresIn: number) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setHydrated: (isHydrated: boolean) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isTokenExpired: () => boolean;
  shouldRefreshToken: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isRefreshing: false,
      isHydrated: false,

      setAuth: (user, token, refreshToken, expiresIn) =>
        set({
          user,
          token,
          refreshToken,
          expiresAt: Date.now() + expiresIn * 1000,
          isAuthenticated: true,
        }),

      setAccessToken: (token, expiresIn) =>
        set({
          token,
          expiresAt: Date.now() + expiresIn * 1000,
        }),

      setRefreshing: (isRefreshing) =>
        set({
          isRefreshing,
        }),

      setHydrated: (isHydrated) =>
        set({
          isHydrated,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isRefreshing: false,
        }),

      updateUser: (user) =>
        set({
          user,
        }),

      // Check if token is expired
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return Date.now() >= expiresAt;
      },

      // Check if we should proactively refresh (1 minute before expiry)
      shouldRefreshToken: () => {
        const { expiresAt, refreshToken } = get();
        if (!expiresAt || !refreshToken) return false;
        // Refresh if less than 1 minute until expiry
        return Date.now() >= expiresAt - 60 * 1000;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when the store is rehydrated from localStorage
        state?.setHydrated(true);
      },
    },
  ),
);
