import { create } from 'zustand'

interface AuthFlowState {
  // State - Route detection
  isResetPasswordPage: boolean
  isAuthCallbackPage: boolean
  isRootPage: boolean
  
  // Actions
  updateRouteDetection: () => void
  
  // Convenience methods for auth flow
  detectSpecialRoutes: () => {
    isResetPasswordPage: boolean
    isAuthCallbackPage: boolean
    isRootPage: boolean
  }
}

/**
 * Store Zustand pour gérer les flux d'authentification
 * Complément au contexte AuthContextSQL pour la gestion des routes spéciales
 */
export const useAuthStore = create<AuthFlowState>((set, get) => ({
  // État initial
  isResetPasswordPage: false,
  isAuthCallbackPage: false,
  isRootPage: true,

  // Détecter les routes spéciales
  detectSpecialRoutes: () => {
    const isResetPasswordPage = window.location.pathname === '/reset-password'
    const isAuthCallbackPage = window.location.pathname === '/auth/callback' || 
      (window.location.search.includes('code=') && window.location.search.includes('type=')) ||
      window.location.search.includes('code=')
    const isRootPage = window.location.pathname === '/' || window.location.pathname === ''
    
    return { isResetPasswordPage, isAuthCallbackPage, isRootPage }
  },

  // Mettre à jour la détection des routes
  updateRouteDetection: () => {
    const routes = get().detectSpecialRoutes()
    set(routes)
  }
}))