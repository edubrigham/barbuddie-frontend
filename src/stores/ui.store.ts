import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface UIState {
  // Theme
  theme: Theme

  // Sidebar
  isSidebarExpanded: boolean

  // Dialogs
  activeDialog: string | null
  dialogProps: Record<string, unknown>

  // Actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  openDialog: (dialogId: string, props?: Record<string, unknown>) => void
  closeDialog: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      isSidebarExpanded: false,
      activeDialog: null,
      dialogProps: {},

      // Theme actions
      setTheme: (theme) => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
        set({ theme: newTheme })
      },

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded }))
      },

      // Dialog actions
      openDialog: (dialogId, props = {}) => {
        set({ activeDialog: dialogId, dialogProps: props })
      },

      closeDialog: () => {
        set({ activeDialog: null, dialogProps: {} })
      },
    }),
    {
      name: 'barbuddie-ui',
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          document.documentElement.classList.remove('light', 'dark')
          document.documentElement.classList.add(state.theme)
        }
      },
    }
  )
)
