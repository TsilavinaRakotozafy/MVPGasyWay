import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Loader2 } from 'lucide-react'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Badge } from '../ui/badge'

interface PackCardCarouselProps {
  images: string[]
  alt: string
  partnerLogo?: string
  partnerName?: string
  isFavorite?: boolean
  onToggleFavorite?: (e: React.MouseEvent) => void
  favoriteLoading?: boolean
  showLoginButton?: boolean
  pack?: any // Pour accéder aux données du pack pour les catégories
}

export function PackCardCarousel({ 
  images, 
  alt, 
  partnerLogo, 
  partnerName,
  isFavorite, 
  onToggleFavorite, 
  favoriteLoading,
  showLoginButton,
  pack
}: PackCardCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const hasMultipleImages = images.length > 1

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex(index)
  }

  return (
    <div className="aspect-[4/3] relative overflow-hidden rounded-lg group/image">
      {/* Image principale */}
      <ImageWithFallback
        src={images[currentImageIndex] || images[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setImageLoaded(true)}
      />

      {/* Flèches de navigation - visibles seulement au hover et s'il y a plusieurs images */}
      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-200 shadow-sm z-20"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-200 shadow-sm z-20"
          >
            <ChevronRight className="h-4 w-4 text-gray-700" />
          </button>
        </>
      )}

      {/* Catégorie en haut à gauche */}
      {pack && pack.category && (
        <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[60%]">
          <Badge 
            variant="secondary" 
            className="bg-white/90 backdrop-blur-sm text-foreground shadow-sm"
            style={{
              fontSize: 'var(--text-p-size, var(--text-base))',
              fontWeight: 'var(--text-p-weight, var(--font-weight-normal))',
              lineHeight: 'var(--text-p-line-height, 1.5)'
            }}
          >
            {pack.category.icon} {pack.category.name}
          </Badge>
        </div>
      )}

      {/* Logo du partenaire - déplacé en bas à gauche */}
      {partnerLogo && (
        <div className="absolute bottom-3 left-3 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
          <ImageWithFallback
            src={partnerLogo}
            alt={partnerName || 'Partenaire'}
            className="w-6 h-6 object-contain"
          />
        </div>
      )}

      {/* Bouton favoris */}
      {(onToggleFavorite || showLoginButton) && (
        <button
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-20"
        >
          {favoriteLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          ) : (
            <Heart 
              className={`h-4 w-4 ${
                isFavorite 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`}
            />
          )}
        </button>
      )}

      {/* Points indicateurs - visibles au hover s'il y a plusieurs images */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                index === currentImageIndex 
                  ? 'bg-white' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}