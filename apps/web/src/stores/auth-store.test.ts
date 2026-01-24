import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, User } from '../auth-store';

// Reset the store before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    isRefreshing: false,
    isHydrated: false,
  });
});

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'STUDENT',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null token initially', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should not be hydrated initially', () => {
      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should set user, tokens, and authentication state', () => {
      const { setAuth } = useAuthStore.getState();
      const expiresIn = 900; // 15 minutes

      setAuth(mockUser, 'access-token', 'refresh-token', expiresIn);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should calculate expiresAt correctly', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      const expiresIn = 900; // 15 minutes

      setAuth(mockUser, 'access-token', 'refresh-token', expiresIn);

      const state = useAuthStore.getState();
      expect(state.expiresAt).toBe(now + expiresIn * 1000);

      vi.useRealTimers();
    });
  });

  describe('setAccessToken', () => {
    it('should update only the access token and expiry', () => {
      // First set full auth
      const { setAuth, setAccessToken } = useAuthStore.getState();
      setAuth(mockUser, 'old-token', 'refresh-token', 900);

      // Then update just the access token
      setAccessToken('new-access-token', 600);

      const state = useAuthStore.getState();
      expect(state.token).toBe('new-access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      // Set auth first
      const { setAuth, logout } = useAuthStore.getState();
      setAuth(mockUser, 'access-token', 'refresh-token', 900);

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.expiresAt).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      const { setAuth, updateUser } = useAuthStore.getState();
      setAuth(mockUser, 'token', 'refresh', 900);

      const updatedUser: User = {
        ...mockUser,
        firstName: 'Jane',
      };
      updateUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.firstName).toBe('Jane');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true if expiresAt is null', () => {
      const { isTokenExpired } = useAuthStore.getState();
      expect(isTokenExpired()).toBe(true);
    });

    it('should return true if token has expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser, 'token', 'refresh', 900);

      // Move time forward past expiry
      vi.setSystemTime(now + 1000 * 1000);

      const { isTokenExpired } = useAuthStore.getState();
      expect(isTokenExpired()).toBe(true);

      vi.useRealTimers();
    });

    it('should return false if token is still valid', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser, 'token', 'refresh', 900);

      // Check immediately (token should be valid)
      const { isTokenExpired } = useAuthStore.getState();
      expect(isTokenExpired()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('shouldRefreshToken', () => {
    it('should return false if no refresh token', () => {
      const { shouldRefreshToken } = useAuthStore.getState();
      expect(shouldRefreshToken()).toBe(false);
    });

    it('should return true if less than 1 minute until expiry', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser, 'token', 'refresh', 900);

      // Move time to 30 seconds before expiry
      vi.setSystemTime(now + 870 * 1000);

      const { shouldRefreshToken } = useAuthStore.getState();
      expect(shouldRefreshToken()).toBe(true);

      vi.useRealTimers();
    });

    it('should return false if more than 1 minute until expiry', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser, 'token', 'refresh', 900);

      // Move time to 5 minutes (300 seconds) into the token lifetime
      vi.setSystemTime(now + 300 * 1000);

      const { shouldRefreshToken } = useAuthStore.getState();
      expect(shouldRefreshToken()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('setHydrated', () => {
    it('should set hydrated state', () => {
      const { setHydrated } = useAuthStore.getState();

      setHydrated(true);

      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(true);
    });
  });

  describe('setRefreshing', () => {
    it('should set refreshing state', () => {
      const { setRefreshing } = useAuthStore.getState();

      setRefreshing(true);

      const state = useAuthStore.getState();
      expect(state.isRefreshing).toBe(true);
    });
  });
});
