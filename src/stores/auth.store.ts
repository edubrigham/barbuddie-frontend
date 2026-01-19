import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  employeeId: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'MANAGER' | 'BARTENDER' | 'WAITER' | 'CASHIER'
  language: 'NL' | 'FR' | 'EN' | 'DE'
  organizationId: string
}

export interface Terminal {
  id: string
  terminalId: string
  name: string
  type: 'COMPUTER' | 'TABLET' | 'HANDHELD' | 'KIOSK'
  posId: string
}

interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  terminal: Terminal | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setTerminal: (terminal: Terminal) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      terminal: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: !!accessToken,
        }),

      setTerminal: (terminal) =>
        set({
          terminal,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          terminal: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
        }),
    }),
    {
      name: 'barbuddie-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        terminal: state.terminal,
      }),
    }
  )
)
