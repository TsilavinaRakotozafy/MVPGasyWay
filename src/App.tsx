import React, { useState, memo } from 'react'
import { AuthProvider } from './contexts/AuthContextSQL'

import { CookieBanner } from './components/common/CookieBanner'
import { CookieCustomizationModal } from './components/common/CookieCustomizationModal'
import { Toaster } from './components/ui/sonner'

// ✅ Composants core externalisés
import { AppRouter } from './components/core/AppRouter'
import { useAppInitializer } from './components/core/AppInitializer'

// ✅ Stores et hooks optimisés
import { useUIStore } from './stores'
import { useAuth } from './contexts/AuthContextSQL'
import { useAppEffects } from './hooks/useAppEffects'

import './styles/globals.css'

/**
 * Composant principal de l'application refactorisé
 * Logique externalisée vers des composants et hooks spécialisés
 */
const AppContent = memo(function AppContent() {
  // ✅ Auth et stores
  const { user, loading, refreshUser } = useAuth()
  
  // ✅ Hooks d'initialisation et effets
  useAppInitializer()
  useAppEffects({ user, loading })

  // ✅ Délégation complète du routing vers AppRouter
  return <AppRouter user={user} loading={loading} refreshUser={refreshUser} />
})

/**
 * App principal avec gestion des cookies
 */
export default function App() {
  const { showCookieCustomization, setShowCookieCustomization } = useUIStore()
  
  return (
    <AuthProvider>
      <AppContent />
      <CookieBanner 
        onAcceptAll={() => {
          console.log('🍪 Tous les cookies acceptés - Services initialisés');
        }}
        onRejectAll={() => {
          console.log('🚫 Cookies optionnels refusés - Services limités');
        }}
        onCustomize={() => {
          setShowCookieCustomization(true);
        }}
      />
      
      <CookieCustomizationModal 
        isOpen={showCookieCustomization}
        onClose={() => setShowCookieCustomization(false)}
        onSave={(preferences) => {
          console.log('🍪 Préférences cookies appliquées:', preferences);
          setShowCookieCustomization(false);
        }}
      />
      
      <Toaster />
    </AuthProvider>
  )
}