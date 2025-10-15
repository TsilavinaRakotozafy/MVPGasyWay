import React, { memo } from 'react'
import { toast } from 'sonner@2.0.3'

import { LoginForm } from '../auth/LoginForm'
import { FirstLoginSetup } from '../auth/FirstLoginSetup'
import { BlockedScreen } from '../auth/BlockedScreen'
import { NewPasswordForm } from '../auth/NewPasswordForm'
import { AuthCallback } from '../auth/AuthCallback'
import { PrivacyPolicy } from '../common/PrivacyPolicy'
import { TermsOfService } from '../common/TermsOfService'
import { CookiePolicy } from '../common/CookiePolicy'

import { AdminRouter } from './AdminRouter'
import { TravelerRouter } from './TravelerRouter'

import { useNavigationStore, useAuthStore } from '../../stores'

interface AppRouterProps {
  user: any
  loading: boolean
  refreshUser: () => Promise<void>
}

/**
 * Routeur principal de l'application
 * Gère toutes les conditions de navigation et d'affichage
 */
export const AppRouter = memo(function AppRouter({ user, loading, refreshUser }: AppRouterProps) {
  const navigation = useNavigationStore()
  const authFlow = useAuthStore()

  // Routes spéciales (reset password, auth callback)
  if (authFlow.isResetPasswordPage) {
    return (
      <NewPasswordForm 
        onSuccess={() => {
          toast.success('Mot de passe mis à jour ! Vous pouvez maintenant vous connecter.')
          window.location.href = '/'
        }}
      />
    )
  }

  if (authFlow.isAuthCallbackPage) {
    return (
      <AuthCallback 
        onSuccess={() => {
          window.location.href = '/'
        }}
        onError={() => {
          window.location.href = '/'
        }}
      />
    )
  }

  // Pages légales
  if (navigation.showLegalPage) {
    switch (navigation.showLegalPage) {
      case 'privacy':
        return <PrivacyPolicy onBack={navigation.handleBackFromLegal} isStandalone={true} />
      case 'terms':
        return <TermsOfService onBack={navigation.handleBackFromLegal} isStandalone={true} />
      case 'cookies':
        return <CookiePolicy onBack={navigation.handleBackFromLegal} isStandalone={true} />
      default:
        navigation.handleBackFromLegal()
        return null
    }
  }

  // Formulaire de connexion
  if (navigation.showLoginForm && !user) {
    return <LoginForm onLoginSuccess={navigation.handleLoginSuccess} />
  }

  // Compte bloqué
  if (user && user.status === 'blocked') {
    return <BlockedScreen />
  }

  // First login setup
  if (user && user.first_login_completed === false) {
    return <FirstLoginSetup onComplete={async () => {
      await refreshUser()
      navigation.setCurrentPage('home')
      toast.success('🎉 Bienvenue sur GasyWay ! Votre profil est maintenant configuré.')
    }} />
  }

  // Interface admin
  if (user?.role === 'admin') {
    return <AdminRouter user={user} />
  }

  // Interface voyageur/publique
  return <TravelerRouter user={user} />
})