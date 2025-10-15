import { create } from 'zustand'

interface UIState {
  // State
  isLoading: boolean
  showCookieCustomization: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
  }>
  
  // Actions
  setLoading: (loading: boolean) => void
  setShowCookieCustomization: (show: boolean) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

/**
 * Store Zustand pour gérer l'état UI global de l'application
 * Gère les loadings, modals, notifications, etc.
 */
export const useUIStore = create<UIState>((set, get) => ({
  // État initial
  isLoading: false,
  showCookieCustomization: false,
  notifications: [],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  
  setShowCookieCustomization: (show) => set({ showCookieCustomization: show }),
  
  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }))
  },
  
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  clearNotifications: () => set({ notifications: [] })
}))