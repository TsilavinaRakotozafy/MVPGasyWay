// ✅ Utilitaires pour récupérer les données des packs depuis Supabase avec ratings
import { Pack } from '../types'
import { projectId, publicAnonKey } from './supabase/info'

/**
 * Récupère tous les packs avec leurs statistiques de reviews depuis Supabase
 */
export async function getAllPacksWithReviews(): Promise<Pack[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Erreur lors de la récupération des packs:', response.status)
      return []
    }

    const result = await response.json()
    
    if (result.success && result.packs) {
      // Traiter les packs pour s'assurer que les données sont correctement typées
      return result.packs.map((pack: any) => ({
        ...pack,
        average_rating: pack.average_rating || null,
        total_reviews: pack.total_reviews || 0,
        is_favorite: pack.is_favorite || false,
        // Assurer que les arrays sont bien formatées
        images: Array.isArray(pack.images) ? pack.images : [],
        included_services: Array.isArray(pack.included_services) ? pack.included_services : [],
        excluded_services: Array.isArray(pack.excluded_services) ? pack.excluded_services : []
      }))
    }

    return []
  } catch (error) {
    console.error('Erreur getAllPacksWithReviews:', error)
    return []
  }
}

/**
 * Récupère les packs actifs avec leurs statistiques de reviews depuis Supabase
 */
export async function getActivePacksWithReviews(): Promise<Pack[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs/active`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Erreur lors de la récupération des packs actifs:', response.status)
      return []
    }

    const result = await response.json()
    
    if (result.success && result.packs) {
      // Traiter les packs pour s'assurer que les données sont correctement typées
      return result.packs.map((pack: any) => ({
        ...pack,
        average_rating: pack.average_rating || null,
        total_reviews: pack.total_reviews || 0,
        is_favorite: pack.is_favorite || false,
        // Assurer que les arrays sont bien formatées
        images: Array.isArray(pack.images) ? pack.images : [],
        included_services: Array.isArray(pack.included_services) ? pack.included_services : [],
        excluded_services: Array.isArray(pack.excluded_services) ? pack.excluded_services : []
      }))
    }

    return []
  } catch (error) {
    console.error('Erreur getActivePacksWithReviews:', error)
    return []
  }
}

/**
 * Récupère un pack spécifique avec ses statistiques de reviews depuis Supabase
 */
export async function getPackByIdWithReviews(packId: string): Promise<Pack | null> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs/${packId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Erreur lors de la récupération du pack:', response.status)
      return null
    }

    const result = await response.json()
    
    if (result.success && result.pack) {
      // Traiter le pack pour s'assurer que les données sont correctement typées
      return {
        ...result.pack,
        average_rating: result.pack.average_rating || null,
        total_reviews: result.pack.total_reviews || 0,
        is_favorite: result.pack.is_favorite || false,
        // Assurer que les arrays sont bien formatées
        images: Array.isArray(result.pack.images) ? result.pack.images : [],
        included_services: Array.isArray(result.pack.included_services) ? result.pack.included_services : [],
        excluded_services: Array.isArray(result.pack.excluded_services) ? result.pack.excluded_services : []
      }
    }

    return null
  } catch (error) {
    console.error('Erreur getPackByIdWithReviews:', error)
    return null
  }
}

/**
 * Formate le display du rating pour l'interface utilisateur
 */
export function formatPackRating(pack: Pack): string {
  if (!pack.average_rating || pack.total_reviews === 0) {
    return 'Pas encore noté'
  }
  
  return `${pack.average_rating.toFixed(1)} (${pack.total_reviews} avis)`
}

/**
 * Détermine si un pack a des avis
 */
export function hasReviews(pack: Pack): boolean {
  return pack.total_reviews > 0 && pack.average_rating !== null
}

/**
 * Récupère le nombre d'étoiles pleines à afficher
 */
export function getStarCount(pack: Pack): number {
  if (!pack.average_rating) return 0
  return Math.round(pack.average_rating)
}

/**
 * Message d'encouragement pour les packs sans avis
 */
export function getNoReviewsMessage(pack: Pack): string {
  return `Soyez le premier à donner votre avis sur "${pack.title}"`
}

/**
 * Interface pour les avis
 */
export interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  date: string
}

/**
 * Récupère les avis d'un pack depuis Supabase
 */
export async function getPackReviews(packId: string): Promise<Review[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs/${packId}/reviews`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Erreur lors de la récupération des avis:', response.status)
      return []
    }

    const result = await response.json()
    
    if (result.success && result.reviews) {
      return result.reviews
    }

    return []
  } catch (error) {
    console.error('Erreur getPackReviews:', error)
    return []
  }
}