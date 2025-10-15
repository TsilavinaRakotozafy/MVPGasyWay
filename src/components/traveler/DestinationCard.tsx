import React from 'react'
import { Card } from '../ui/card'
import { ImageWithFallback } from '../figma/ImageWithFallback'

interface DestinationCardProps {
  /**
   * Nom de la destination
   */
  name: string
  /**
   * Description courte de la destination
   */
  description: string
  /**
   * URL de l'image de la destination
   */
  imageUrl: string
  /**
   * Texte alternatif pour l'image
   */
  imageAlt?: string
  /**
   * Fonction appelée lors du clic sur la card
   */
  onClick?: () => void
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Composant DestinationCard pour GasyWay
 * 
 * Utilisé pour afficher les destinations touristiques avec une image, 
 * un titre en H4 et une description. Conforme au design system GasyWay.
 * 
 * @example
 * ```tsx
 * <DestinationCard
 *   name="Nosy Be"
 *   description="Écolodges & expériences marines"
 *   imageUrl="https://example.com/nosy-be.jpg"
 *   onClick={() => navigateToDestination('nosy-be')}
 * />
 * ```
 */

export function DestinationCard({
  name,
  description,
  imageUrl,
  imageAlt,
  onClick,
  className = ""
}: DestinationCardProps) {
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <ImageWithFallback
          src={imageUrl}
          alt={imageAlt || name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 text-white p-4">
          <h4>{name}</h4>
          <p className="opacity-90">
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}