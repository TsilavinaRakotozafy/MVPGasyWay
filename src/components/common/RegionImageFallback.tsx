import React from 'react'
import { MapPin } from 'lucide-react'

interface RegionImageFallbackProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

export function RegionImageFallback({ 
  src, 
  alt, 
  className = "w-full h-48 object-cover rounded-lg",
  fallbackClassName = "w-full h-48 bg-secondary rounded-lg flex items-center justify-center"
}: RegionImageFallbackProps) {
  
  // Si pas d'image, afficher le fallback
  if (!src || src.trim() === '') {
    return (
      <div className={fallbackClassName}>
        <div className="flex flex-col items-center justify-center gap-2 text-secondary-foreground/60">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Image à ajouter</span>
        </div>
      </div>
    )
  }

  // Si image présente, l'afficher avec fallback en cas d'erreur
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        // En cas d'erreur de chargement, remplacer par le fallback
        const target = e.target as HTMLImageElement
        const parent = target.parentElement
        if (parent) {
          parent.innerHTML = `
            <div class="${fallbackClassName}">
              <div class="flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-sm">Image indisponible</span>
              </div>
            </div>
          `
        }
      }}
    />
  )
}

/**
 * Hook pour obtenir l'URL d'image avec fallback
 */
export function useRegionImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null
  }
  
  return imageUrl.trim()
}

/**
 * Utilitaire pour vérifier si une région a une image
 */
export function hasRegionImage(imageUrl: string | null | undefined): boolean {
  return Boolean(imageUrl && imageUrl.trim() !== '')
}