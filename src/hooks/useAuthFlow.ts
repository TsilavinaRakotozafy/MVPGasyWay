import { useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContextSQL'
import { toast } from 'sonner@2.0.3'

export interface AuthFlowActions {
  handleFirstLoginComplete: () => Promise<void>
  handleLogoutRedirect: () => void
  handleAdminRedirect: () => void
}

export interface UseAuthFlowReturn extends AuthFlowActions {
  user: any
  loading: boolean
  isResetPasswordPage: boolean
  isAuthCallbackPage: boolean
  isRootPage: boolean
}

/**
 * Hook personnalisé pour gérer les flux d'authentification
 * Gère les redirections, première connexion, callbacks, etc.
 */
export function useAuthFlow(
  currentPage: string,
  onPageChange: (page: string) => void,
  onResetNavigation: () => void
): UseAuthFlowReturn {
  const { user, loading, refreshUser } = useAuth()

  // Détecter les routes spéciales
  const isResetPasswordPage = window.location.pathname === '/reset-password'
  const isAuthCallbackPage = window.location.pathname === '/auth/callback' || 
    (window.location.search.includes('code=') && window.location.search.includes('type=')) ||
    window.location.search.includes('code=')
  const isRootPage = window.location.pathname === '/' || window.location.pathname === ''

  // Callback memoïsé pour gérer la fin de première connexion
  const handleFirstLoginComplete = useCallback(async () => {
    await refreshUser()
    onPageChange('home')
    toast.success('🎉 Bienvenue sur GasyWay ! Votre profil est maintenant configuré.')
  }, [refreshUser, onPageChange])

  // Callback memoïsé pour gérer la déconnexion
  const handleLogoutRedirect = useCallback(() => {
    onResetNavigation()
  }, [onResetNavigation])

  // Callback memoïsé pour redirection admin
  const handleAdminRedirect = useCallback(() => {
    if (user?.role === 'admin' && currentPage === 'home') {
      onPageChange('dashboard')
    }
  }, [user?.role, currentPage, onPageChange])

  // Gérer la navigation selon le rôle (anti-loop optimisé)
  useEffect(() => {
    if (loading) return
    handleAdminRedirect()
  }, [user?.role, loading, handleAdminRedirect])

  // Gérer la déconnexion (anti-loop optimisé)
  useEffect(() => {
    // Guard strict : seulement si pas connecté ET pas sur home
    if (user === null && !loading && currentPage !== 'home') {
      handleLogoutRedirect()
    }
  }, [user, loading, currentPage, handleLogoutRedirect])

  return {
    // Auth state
    user,
    loading,
    // Route detection
    isResetPasswordPage,
    isAuthCallbackPage,
    isRootPage,
    // Actions
    handleFirstLoginComplete,
    handleLogoutRedirect,
    handleAdminRedirect
  }
}