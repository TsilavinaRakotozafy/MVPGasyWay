import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { Star, MessageSquare, Calendar, MapPin, Edit3, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

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
  packs: {
    title: string
    location: string
    pack_images: Array<{
      image_url: string
      is_primary: boolean
    }>
  }
}

const statusConfig = {
  pending: { label: 'En attente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approuvé', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Refusé', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
  reported: { label: 'Signalé', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
}

export function ReviewsPageSupabase() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editForm, setEditForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    service_rating: 5,
    value_rating: 5,
    location_rating: 5,
    guide_rating: 5,
    would_recommend: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchReviews()
    }
  }, [user])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          packs (
            title,
            location,
            pack_images (
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setReviews(data || [])
    } catch (error) {
      console.error('Erreur chargement avis:', error)
      toast.error('Erreur lors du chargement de vos avis')
    } finally {
      setLoading(false)
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setEditForm({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
      service_rating: review.service_rating || 5,
      value_rating: review.value_rating || 5,
      location_rating: review.location_rating || 5,
      guide_rating: review.guide_rating || 5,
      would_recommend: review.would_recommend ?? true
    })
  }

  const handleSubmitEdit = async () => {
    if (!editingReview) return

    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('reviews')
        .update({
          ...editForm,
          status: 'pending', // Re-modération nécessaire après modification
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReview.id)
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      toast.success('Avis modifié avec succès')
      setEditingReview(null)
      fetchReviews()
      
    } catch (error) {
      console.error('Erreur modification avis:', error)
      toast.error('Erreur lors de la modification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return

    try {
      setDeletingId(reviewId)
      
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      toast.success('Avis supprimé avec succès')
      fetchReviews()
      
    } catch (error) {
      console.error('Erreur suppression avis:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-${size/4} w-${size/4} ${
              star <= rating 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <OptimizedSpinner size={32} />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Mes avis</h1>
          <p className="text-muted-foreground">Gérez vos avis et évaluations</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">Aucun avis</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Vous n'avez encore donné aucun avis. Partagez votre expérience après vos voyages !
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Mes avis</h1>
        <p className="text-muted-foreground">
          {reviews.length} avis donné{reviews.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => {
          const primaryImage = review.packs.pack_images.find(img => img.is_primary)?.image_url
          const status = statusConfig[review.status]
          
          return (
            <Card key={review.id} className="overflow-hidden">
              <div className="md:flex">
                {/* Image du pack */}
                {primaryImage && (
                  <div className="md:w-48 h-48 md:h-auto">
                    <img 
                      src={primaryImage}
                      alt={review.packs.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Contenu principal */}
                <div className="flex-1 p-6">
                  <CardHeader className="p-0 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{review.packs.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          {review.packs.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 space-y-4">
                    {/* Note principale */}
                    <div className="flex items-center gap-4">
                      {renderStars(review.rating)}
                      <span className="font-medium">{review.rating}/5</span>
                    </div>

                    {/* Titre et commentaire */}
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                    
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}

                    {/* Notes détaillées */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {review.service_rating && (
                        <div>
                          <p className="text-muted-foreground">Service</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.service_rating, 12)}
                            <span className="text-xs ml-1">{review.service_rating}/5</span>
                          </div>
                        </div>
                      )}
                      {review.value_rating && (
                        <div>
                          <p className="text-muted-foreground">Rapport qualité/prix</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.value_rating, 12)}
                            <span className="text-xs ml-1">{review.value_rating}/5</span>
                          </div>
                        </div>
                      )}
                      {review.location_rating && (
                        <div>
                          <p className="text-muted-foreground">Destination</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.location_rating, 12)}
                            <span className="text-xs ml-1">{review.location_rating}/5</span>
                          </div>
                        </div>
                      )}
                      {review.guide_rating && (
                        <div>
                          <p className="text-muted-foreground">Guide</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.guide_rating, 12)}
                            <span className="text-xs ml-1">{review.guide_rating}/5</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommandation */}
                    {review.would_recommend !== null && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Recommande ce pack: </span>
                        <span className={review.would_recommend ? 'text-green-600' : 'text-red-600'}>
                          {review.would_recommend ? '✓ Oui' : '✗ Non'}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Modifier votre avis</DialogTitle>
                            <DialogDescription>
                              Modifiez votre avis pour "{review.packs.title}"
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="rating">Note générale *</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEditForm(prev => ({...prev, rating: star}))}
                                    className="p-1"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${
                                        star <= editForm.rating 
                                          ? 'text-yellow-500 fill-yellow-500' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="ml-2">{editForm.rating}/5</span>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="title">Titre de l'avis</Label>
                              <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                                placeholder="Résumez votre expérience..."
                              />
                            </div>

                            <div>
                              <Label htmlFor="comment">Votre avis détaillé</Label>
                              <Textarea
                                id="comment"
                                value={editForm.comment}
                                onChange={(e) => setEditForm(prev => ({...prev, comment: e.target.value}))}
                                placeholder="Partagez votre expérience en détail..."
                                rows={4}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Service ({editForm.service_rating}/5)</Label>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditForm(prev => ({...prev, service_rating: star}))}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          star <= editForm.service_rating 
                                            ? 'text-yellow-500 fill-yellow-500' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label>Rapport qualité/prix ({editForm.value_rating}/5)</Label>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditForm(prev => ({...prev, value_rating: star}))}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          star <= editForm.value_rating 
                                            ? 'text-yellow-500 fill-yellow-500' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="recommend"
                                checked={editForm.would_recommend}
                                onChange={(e) => setEditForm(prev => ({...prev, would_recommend: e.target.checked}))}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="recommend">Je recommande ce pack</Label>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleSubmitEdit}
                              disabled={submitting}
                            >
                              {submitting ? <OptimizedSpinner size={16} /> : 'Enregistrer'}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingReview(null)}>
                              Annuler
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingId === review.id}
                      >
                        {deletingId === review.id ? (
                          <OptimizedSpinner size={16} />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}