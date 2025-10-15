import React from 'react'

/**
 * Skeleton pour PackCard
 * Structure identique au PackCard pour éviter les décalages de hauteur
 */
export function PackCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Image skeleton avec même aspect ratio que PackCardCarousel (4/3) */}
      <div className="aspect-[4/3] bg-muted animate-pulse rounded-lg" />
      
      {/* Contenu skeleton qui correspond exactement au PackCard */}
      <div className="space-y-1">
        {/* Titre et rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 bg-muted animate-pulse rounded flex-1" />
          <div className="h-5 bg-muted animate-pulse rounded w-12 flex-shrink-0" />
        </div>
        
        {/* Description (2 lignes tronquées avec line-clamp-2) */}
        <div className="space-y-1">
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </div>
        
        {/* Localisation */}
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        
        {/* Durée, participants et difficulté */}
        <div className="flex items-center gap-4">
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
        </div>
        
        {/* Prix avec pt-2 comme dans PackCard */}
        <div className="pt-2">
          <div className="h-5 bg-muted animate-pulse rounded w-24" />
        </div>
      </div>
    </div>
  )
}
