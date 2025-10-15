import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { toast } from 'sonner@2.0.3'
import { 
  Star,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  service_rating?: number
  value_rating?: number
  location_rating?: number
  guide_rating?: number
  status: 'pending' | 'approved' | 'rejected' | 'reported'
  would_recommend?: boolean
  created_at: string
  updated_at: string
  moderated_at?: string
  moderation_reason?: string
  user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  pack: {
    id: string
    title: string
    location: string
  }
  images: Array<{
    id: string
    image_url: string
    caption?: string
  }>
  booking?: {
    id: string
    booking_reference: string
  }
}

export function ReviewsManagement() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [moderationReason, setModerationReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  useEffect(() => {
    if (user?.role === 'admin') {
      loadReviews()
    }
  }, [user])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users!reviews_user_id_fkey (
            id,
            email,
            first_name,
            last_name
          ),
          pack:packs (
            id,
            title,
            location
          ),
          images:review_images (
            id,
            image_url,
            caption
          ),
          booking:bookings (
            id,
            booking_reference
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setReviews(data || [])
    } catch (error) {
      console.error('Erreur chargement avis:', error)
      toast.error('Erreur lors du chargement des avis')
    } finally {
      setLoading(false)
    }
  }

  const moderateReview = async (reviewId: string, newStatus: 'approved' | 'rejected', reason?: string) => {
    setActionLoading(reviewId)
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: newStatus,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason || null
        })
        .eq('id', reviewId)

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              status: newStatus,
              moderated_at: new Date().toISOString(),
              moderation_reason: reason
            }
          : review
      ))

      toast.success(`Avis ${newStatus === 'approved' ? 'approuvé' : 'rejeté'}`)
      setIsDetailDialogOpen(false)
      setModerationReason('')
    } catch (error) {
      console.error('Erreur modération avis:', error)
      toast.error('Erreur lors de la modération')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    
    let matchesRating = true
    if (ratingFilter === '5') {
      matchesRating = review.rating === 5
    } else if (ratingFilter === '4') {
      matchesRating = review.rating === 4
    } else if (ratingFilter === '3') {
      matchesRating = review.rating === 3
    } else if (ratingFilter === '1-2') {
      matchesRating = review.rating <= 2
    }
    
    return matchesSearch && matchesStatus && matchesRating
  })

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      reported: 'Signalé'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      reported: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`${starSize} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const openDetailDialog = (review: Review) => {
    setSelectedReview(review)
    setIsDetailDialogOpen(true)
  }

  // Vérification d'accès admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Modération des Avis</h1>
          <p className="text-gray-600">Gérez et modérez les avis clients</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par titre, commentaire, pack ou utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
            <SelectItem value="reported">Signalés</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Note" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes notes</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
            <SelectItem value="3">⭐⭐⭐</SelectItem>
            <SelectItem value="1-2">⭐⭐ et moins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-sm text-gray-600">Total avis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {reviews.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {reviews.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-sm text-gray-600">Approuvés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {reviews.filter(r => r.status === 'rejected').length}
            </div>
            <p className="text-sm text-gray-600">Rejetés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0}
            </div>
            <p className="text-sm text-gray-600">Note moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des avis */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des avis...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis trouvé</h3>
            <p className="text-gray-500">Aucun avis ne correspond à vos critères de recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating)}
                      <Badge className={getStatusColor(review.status)}>
                        {getStatusLabel(review.status)}
                      </Badge>
                      {review.would_recommend && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Recommande
                        </Badge>
                      )}
                    </div>
                    
                    {review.title && (
                      <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{review.user.first_name} {review.user.last_name} ({review.user.email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{review.pack.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Posté le {formatDate(review.created_at)}</span>
                      </div>
                      {review.booking && (
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span>Réservation: {review.booking.booking_reference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">{review.comment}</p>
                  </div>
                )}

                {/* Évaluations détaillées */}
                {(review.service_rating || review.value_rating || review.location_rating || review.guide_rating) && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {review.service_rating && (
                      <div className="text-sm">
                        <span className="text-gray-600">Service:</span>
                        {renderStars(review.service_rating, 'sm')}
                      </div>
                    )}
                    {review.value_rating && (
                      <div className="text-sm">
                        <span className="text-gray-600">Rapport qualité/prix:</span>
                        {renderStars(review.value_rating, 'sm')}
                      </div>
                    )}
                    {review.location_rating && (
                      <div className="text-sm">
                        <span className="text-gray-600">Lieu:</span>
                        {renderStars(review.location_rating, 'sm')}
                      </div>
                    )}
                    {review.guide_rating && (
                      <div className="text-sm">
                        <span className="text-gray-600">Guide:</span>
                        {renderStars(review.guide_rating, 'sm')}
                      </div>
                    )}
                  </div>
                )}

                {review.images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">{review.images.length} image(s) jointe(s)</p>
                    <div className="flex gap-2">
                      {review.images.slice(0, 3).map((image) => (
                        <div key={image.id} className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          <img
                            src={image.image_url}
                            alt={image.caption || 'Image avis'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                      {review.images.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                          +{review.images.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {review.moderated_at && (
                      <span>Modéré le {formatDate(review.moderated_at)}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailDialog(review)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    
                    {review.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => moderateReview(review.id, 'approved')}
                          disabled={actionLoading === review.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === review.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailDialog(review)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de détails et modération */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'avis</DialogTitle>
            <DialogDescription>
              Avis complet et options de modération
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {renderStars(selectedReview.rating, 'md')}
                <Badge className={getStatusColor(selectedReview.status)}>
                  {getStatusLabel(selectedReview.status)}
                </Badge>
              </div>
              
              {selectedReview.title && (
                <div>
                  <Label className="font-medium">Titre</Label>
                  <p className="mt-1">{selectedReview.title}</p>
                </div>
              )}
              
              {selectedReview.comment && (
                <div>
                  <Label className="font-medium">Commentaire</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedReview.comment}</p>
                </div>
              )}
              
              {selectedReview.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <Label htmlFor="moderation_reason">Raison de modération (optionnel)</Label>
                  <Textarea
                    id="moderation_reason"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Expliquez pourquoi vous approuvez ou rejetez cet avis..."
                    rows={3}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => moderateReview(selectedReview.id, 'approved', moderationReason)}
                      disabled={actionLoading === selectedReview.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => moderateReview(selectedReview.id, 'rejected', moderationReason)}
                      disabled={actionLoading === selectedReview.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}