import { useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { dataPreloader } from '../../utils/performance'
import { apiClient } from '../../utils/api'

export function DataPreloader() {
  const { user } = useAuth()

  const preloadTravelerData = useCallback(async () => {
    if (!user?.profile?.id) return
    
    console.log('🚀 Préchargement des données voyageur...')
    
    // Packs touristiques (haute priorité)
    dataPreloader.schedule('packs', async () => {
      return apiClient.getPacks()
    }, 3)

    // Centres d'intérêt (priorité moyenne)
    dataPreloader.schedule('interests', async () => {
      return apiClient.getInterests()
    }, 2)

    // Catégories (basse priorité)
    dataPreloader.schedule('categories', async () => {
      return apiClient.getCategories()
    }, 1)

    // Centres d'intérêt utilisateur (si connecté)
    dataPreloader.schedule(`user_interests_${user.profile.id}`, async () => {
      const { supabase } = await import('../../utils/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return apiClient.getUserInterests(user.profile.id, session.access_token)
      }
      return []
    }, 2)
  }, [user?.profile?.id])

  const preloadAdminData = useCallback(async () => {
    if (!user?.profile?.id) return
    
    console.log('🚀 Préchargement des données administrateur...')
    
    const { supabase } = await import('../../utils/supabase/client')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    // Statistiques admin (haute priorité)
    dataPreloader.schedule('admin_stats', async () => {
      return apiClient.getAdminStats(session.access_token)
    }, 3)

    // Packs admin (priorité moyenne)
    dataPreloader.schedule('admin_packs', async () => {
      return apiClient.getAdminPacks(session.access_token)
    }, 2)

    // Données de base (basse priorité)
    dataPreloader.schedule('interests_admin', async () => {
      return apiClient.getInterests()
    }, 1)

    dataPreloader.schedule('categories_admin', async () => {
      return apiClient.getCategories()
    }, 1)
  }, [user?.profile?.id])

  useEffect(() => {
    if (!user) return

    // Préchargement des données selon le rôle utilisateur
    if (user.profile.role === 'traveler') {
      preloadTravelerData()
    } else if (user.profile.role === 'admin') {
      preloadAdminData()
    }
  }, [user, preloadTravelerData, preloadAdminData])

  // Ce composant ne rend rien, il ne fait que précharger
  return null
}