import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Heart, MapPin, Users, Calendar, Clock, Eye, Loader2, Star, MessageSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface Pack {
  id: string
  title: string
  description: string
  short_description?: string
  price: number
  currency: string
  duration_days: number
  max_participants: number
  min_participants: number
  location: string
  category_id: string
  status: 'active' | 'inactive' | 'archived'
  images: string[]
  included_services: string[]
  excluded_services?: string[]
  difficulty_level?: 'easy' | 'medium' | 'hard'
  season_start?: string
  season_end?: string
  cancellation_policy?: string
  created_by: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description?: string
    icon?: string
  }
  is_favorite?: boolean
  imageUrl?: string
}

interface FavoriteWithPack {
  id: string
  user_id: string
  pack_id: string
  created_at: string
  pack: Pack
}

interface UserReview {
  id: string
  pack_id: string
  rating: number
  title?: string
  comment: string
  created_at: string
  updated_at: string
  pack: {
    id: string
    title: string
    imageUrl?: string
  }
}

interface FavoritesPageSupabaseProps {
  onPageChange: (page: string) => void
  onPackSelect: (pack: Pack) => void
}

export function FavoritesPageSupabase({ onPageChange, onPackSelect }: FavoritesPageSupabaseProps) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteWithPack[]>([])
  const [userReviews, setUserReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('favorites')

  useEffect(() => {
    if (user) {
      loadFavorites()
      loadUserReviews()
    } else {
      setLoading(false)
      setReviewsLoading(false)
    }
  }, [user])

  async function loadFavorites() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          pack:packs (
            *,
            category:pack_categories (
              id,
              name,
              description,
              icon
            ),
            images:pack_images (
              image_url,
              is_primary,
              display_order
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformer les données pour correspondre à l'interface attendue
      const transformedFavorites = (data || []).map(favorite => ({
        ...favorite,
        pack: {
          ...favorite.pack,
          images: favorite.pack.images?.map(img => img.image_url) || [],
          imageUrl: favorite.pack.images?.find(img => img.is_primary)?.image_url || 
                   favorite.pack.images?.[0]?.image_url || 
                   `https://via.placeholder.com/400x250/2563eb/ffffff?text=${encodeURIComponent(favorite.pack.title.substring(0, 15))}`,
          is_favorite: true
        }
      }))

      setFavorites(transformedFavorites)
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
      toast.error('Erreur lors du chargement des favoris')
    } finally {
      setLoading(false)
    }
  }

  async function loadUserReviews() {
    if (!user) return

    try {
      setReviewsLoading(true)
      const { data, error } = await supabase
        .from('pack_reviews')
        .select(`
          id,
          pack_id,
          rating,
          title,
          comment,
          created_at,
          updated_at,
          packs!inner (
            id,
            title,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformer les données
      const transformedReviews = (data || []).map(review => ({
        ...review,
        pack: {
          id: review.packs.id,
          title: review.packs.title,
          imageUrl: Array.isArray(review.packs.images) && review.packs.images.length > 0 
            ? review.packs.images[0] 
            : `https://via.placeholder.com/400x250/2563eb/ffffff?text=${encodeURIComponent(review.packs.title.substring(0, 15))}`
        }
      }))

      setUserReviews(transformedReviews)
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
      toast.error('Erreur lors du chargement de vos avis')
    } finally {
      setReviewsLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string, packTitle: string) => {
    if (!user) return

    setRemovingId(favoriteId)
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id) // Sécurité supplémentaire

      if (error) {
        throw error
      }

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
      toast.success(`"${packTitle}" retiré de vos favoris`)
    } catch (error) {
      console.error('Erreur suppression favori:', error)
      toast.error('Erreur lors de la suppression du favori')
    } finally {
      setRemovingId(null)
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (difficulty?: string) => {
    const labels = {
      easy: 'Facile',
      medium: 'Modéré',
      hard: 'Difficile'
    }
    return labels[difficulty as keyof typeof labels] || 'Non défini'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MG').format(price) + ' Ar'
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg mb-2">Connexion requise</h3>
        <p className="text-gray-500 mb-6">
          Vous devez être connecté pour voir vos favoris.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl">Mes favoris</h1>
          <p className="text-gray-600">Vos packs favoris sauvegardés</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Mes favoris ❤️</h1>
          <p className="text-gray-600">
            {favorites.length} pack{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => onPageChange('catalog')}>
          Explorer le catalogue
        </Button>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Aucun favori encore</h3>
          <p className="text-gray-500 mb-6">
            Commencez à explorer notre catalogue et ajoutez vos packs préférés à vos favoris.
          </p>
          <Button onClick={() => onPageChange('catalog')}>
            Découvrir les packs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => (
            <Card 
              key={favorite.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => onPackSelect(favorite.pack)}
            >
              <div className="aspect-video relative overflow-hidden">
                <ImageWithFallback
                  src={favorite.pack.imageUrl || `https://via.placeholder.com/400x250/2563eb/ffffff?text=${encodeURIComponent(favorite.pack.title.substring(0, 15))}`}
                  alt={favorite.pack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Badges overlay */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {favorite.pack.category && (
                    <Badge className="bg-white/90 text-gray-800">
                      {favorite.pack.category.icon} {favorite.pack.category.name}
                    </Badge>
                  )}
                </div>

                {/* Bouton supprimer des favoris */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFavorite(favorite.id, favorite.pack.title)
                  }}
                  disabled={removingId === favorite.id}
                  className="absolute top-3 right-3 p-2 bg-red-500/80 backdrop-blur-sm rounded-full hover:bg-red-600 transition-colors shadow-sm text-white disabled:opacity-50"
                  title="Retirer des favoris"
                >
                  {removingId === favorite.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 fill-white" />
                  )}
                </button>

                {/* Badge favori depuis */}
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-white/90">
                    ❤️ Favori depuis {new Date(favorite.created_at).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getDifficultyColor(favorite.pack.difficulty_level)}>
                    {getDifficultyLabel(favorite.pack.difficulty_level)}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {favorite.pack.duration_days}j
                  </div>
                </div>
                
                <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {favorite.pack.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {favorite.pack.short_description || favorite.pack.description.substring(0, 100)}...
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{favorite.pack.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                    {favorite.pack.min_participants}-{favorite.pack.max_participants} participants
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-lg font-bold text-green-600">{formatPrice(favorite.pack.price)}</span>
                    <p className="text-xs text-gray-500">par personne</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPackSelect(favorite.pack)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir détails
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPackSelect(favorite.pack)
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Réserver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}