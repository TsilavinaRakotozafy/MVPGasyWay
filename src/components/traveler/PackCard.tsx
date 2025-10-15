import React from 'react'
import { Badge } from '../ui/badge'
import { PackCardCarousel } from './PackCardCarousel'
import { MapPin, Users, Clock, Star } from 'lucide-react'
import { Pack } from '../../types'

interface PackCardProps {
  pack: Pack
  onToggleFavorite?: (e: React.MouseEvent) => void
  favoriteLoading?: boolean
  showLoginButton?: boolean
  onClick?: () => void
}

export function PackCard({ 
  pack, 
  onToggleFavorite, 
  favoriteLoading, 
  showLoginButton,
  onClick 
}: PackCardProps) {
  
  const getDifficultyLabel = (level?: string) => {
    const labels = {
      easy: 'Facile',
      medium: 'Modéré', 
      hard: 'Difficile'
    }
    return labels[level as keyof typeof labels] || 'Non défini'
  }

  const getDifficultyColor = (level?: string) => {
    const colors = {
      easy: 'bg-secondary text-secondary-foreground',
      medium: 'bg-accent text-accent-foreground',
      hard: 'bg-destructive text-destructive-foreground'
    }
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MG').format(price) + ' Ar/pers'
  }

  // Utiliser les images du pack ou une image par défaut
  const images = pack.images && pack.images.length > 0 
    ? pack.images 
    : [pack.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop`]

  return (
    <div 
      className="cursor-pointer group hover:opacity-95 transition-opacity duration-200"
      onClick={onClick}
    >
      {/* Carrousel d'images */}
      <PackCardCarousel
        images={images}
        alt={pack.title}
        partnerLogo={pack.partner?.logo}
        partnerName={pack.partner?.name}
        isFavorite={pack.is_favorite}
        onToggleFavorite={onToggleFavorite}
        favoriteLoading={favoriteLoading}
        showLoginButton={showLoginButton}
        pack={pack}
      />

      {/* Informations du pack */}
      <div className="mt-3 space-y-1">
        {/* Première ligne : Titre et rating */}
        <div className="flex items-start justify-between gap-2">
          <h5 className="line-clamp-1 flex-1 group-hover:text-muted-foreground transition-colors">
            {pack.title}
          </h5>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-current text-foreground" />
            <span className="text-sm text-foreground text-[14px] font-bold font-normal">
              {pack.average_rating ? pack.average_rating.toFixed(1) : 'Pas encore noté'} {pack.total_reviews > 0 && `(${pack.total_reviews})`}
            </span>
          </div>
        </div>

        {/* Deuxième ligne : Description (2 lignes tronquées) */}
        <p className="text-muted-foreground line-clamp-2">
          {pack.description || pack.short_description || 'Découvrez cette expérience unique à Madagascar.'}
        </p>

        {/* Troisième ligne : Localisation */}
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="text-sm truncate text-[14px]">{pack.location}</span>
        </div>

        {/* Quatrième ligne : Durée, participants et difficulté */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span className="text-[14px]">{pack.duration_days} jour{pack.duration_days > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span className="text-[14px]">{pack.min_participants}-{pack.max_participants}</span>
          </div>
          {pack.difficulty_level && (
            <Badge className={`text-xs ${getDifficultyColor(pack.difficulty_level)}`}>
              {getDifficultyLabel(pack.difficulty_level)}
            </Badge>
          )}
        </div>

        {/* Cinquième ligne : Prix */}
        <div className="pt-2">
          <h6 className="text-foreground text-[14px]">
            {formatPrice(pack.price)}
          </h6>
        </div>
      </div>
    </div>
  )
}