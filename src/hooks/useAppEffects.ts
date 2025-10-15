import { useEffect } from 'react'
import { Pack } from '../types'
import { useNavigationStore, usePacksStore, useAuthStore } from '../stores'

interface UseAppEffectsProps {
  user: any
  loading: boolean
}

/**
 * Hook centralisé pour tous les effets de l'application
 * Gère les flux d'auth, événements custom, navigation
 */
export function useAppEffects({ user, loading }: UseAppEffectsProps) {
  const navigation = useNavigationStore()
  const packs = usePacksStore()
  const authFlow = useAuthStore()

  // Initialiser la détection des routes au mount
  useEffect(() => {
    authFlow.updateRouteDetection()
  }, [])

  // ✅ Gestion des flux d'authentification selon le rôle/état
  useEffect(() => {
    if (loading) return
    
    // Auto-redirect admin vers dashboard
    if (user?.role === 'admin' && navigation.currentPage === 'home') {
      navigation.setCurrentPage('dashboard')
    }
    
    // Auto-redirect déconnecté vers home seulement pour les pages protégées
    const publicPages = ['home', 'about', 'blog', 'partners', 'contact', 'destinations', 'catalog', 'pack-detail', 'pack-gallery']
    const isPublicPage = publicPages.includes(navigation.currentPage)
    
    if (user === null && !loading && !isPublicPage) {
      navigation.resetToHome()
    }
  }, [user, loading, navigation.currentPage])

  // ✅ Événements custom pour navigation vers galerie et pages légales
  useEffect(() => {
    const handleNavigateToGallery = (event: CustomEvent) => {
      const pack = event.detail as Pack;
      packs.handleShowPackGallery(pack, navigation.handlePageChange);
    };

    const handleNavigateToLegal = (event: CustomEvent) => {
      const pageType = event.detail as string;
      navigation.handleShowLegalPage(pageType);
    };

    window.addEventListener('navigate-to-gallery', handleNavigateToGallery as EventListener);
    window.addEventListener('navigate-to-legal', handleNavigateToLegal as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-gallery', handleNavigateToGallery as EventListener);
      window.removeEventListener('navigate-to-legal', handleNavigateToLegal as EventListener);
    };
  }, [])
}