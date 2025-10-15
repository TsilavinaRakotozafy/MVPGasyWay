import { useEffect } from 'react'
import { initializeDesignSystem, watchDesignTokenChanges } from '../../utils/design-system-loader'
import { logSupabaseInstructions } from '../../utils/figma-make-config'

/**
 * Hook d'initialisation de l'application
 * Extrait d'App.tsx pour simplifier le composant principal
 */
export function useAppInitializer() {
  useEffect(() => {
    // ✅ FIX UTF-8 : Forcer l'encodage directement
    document.documentElement.setAttribute('lang', 'fr')
    
    // Supprimer tous les meta charset existants
    const existingCharsets = document.querySelectorAll('meta[charset]')
    existingCharsets.forEach(meta => meta.remove())
    
    // Créer et insérer le meta charset en PREMIÈRE position
    const charset = document.createElement('meta')
    charset.setAttribute('charset', 'UTF-8')
    const firstChild = document.head.firstChild
    if (firstChild) {
      document.head.insertBefore(charset, firstChild)
    } else {
      document.head.appendChild(charset)
    }

    // ✅ Assurer que le viewport est correct
    const metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
      const viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      document.head.appendChild(viewport)
    }

    const loadDesignSystem = async () => {
      await initializeDesignSystem()
      watchDesignTokenChanges()
    }
    
    loadDesignSystem()

    // 🍪 Initialiser les services selon le consentement cookies
    console.log('🔧 Mode développement - Système cookies complètement désactivé')
    
    // Écouter les changements de consentement
    const handleConsentUpdate = () => {
      console.log('🍪 Changement de consentement détecté (mode dev)')
    }
    
    window.addEventListener('cookie-consent-updated', handleConsentUpdate)

    // Afficher les instructions Supabase pour Figma Make au démarrage
    setTimeout(() => {
      console.log('🎯 GasyWay - Application Figma Make initialisée')
      console.log('🌐 URL détectée:', window.location.href)
      console.log('📱 Navigation: Système interne React (pas de vraies routes URL)')
      console.log('')
      console.log('📧 Fonctionnalités disponibles:')
      console.log('   • Inscription avec validation email')
      console.log('   • Réinitialisation de mot de passe')
      console.log('   • Redirection automatique après email')
      console.log('')
      logSupabaseInstructions()
      console.log('')
      console.log('⚠️ IMPORTANT:')
      console.log('   • URL de base → Affiche l\'application (normal)')
      console.log('   • /reset-password → Accessible via email Supabase uniquement')
      console.log('   • /auth/callback → Accessible via email Supabase uniquement')
      console.log('   • Toute autre URL → Not Found (comportement normal)')
    }, 2000)

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate)
    }
  }, [])
}