import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { CalendarDays, MapPin, Users, CreditCard, Phone, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface Booking {
  id: string
  booking_reference: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded'
  number_of_participants: number
  start_date: string
  end_date: string
  price_per_person: number
  total_price: number
  currency: string
  contact_name: string
  contact_email: string
  contact_phone: string
  special_requests?: string
  created_at: string
  packs: {
    title: string
    location: string
    pack_images: Array<{
      image_url: string
      is_primary: boolean
    }>
  }
  payments: Array<{
    status: string
    amount: number
    payment_method: string
  }>
}

const statusConfig = {
  pending: { label: 'En attente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmée', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
  completed: { label: 'Terminée', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
  refunded: { label: 'Remboursée', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' }
}

export function BookingsPageSupabase() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          packs (
            title,
            location,
            pack_images (
              image_url,
              is_primary
            )
          ),
          payments (
            status,
            amount,
            payment_method
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setBookings(data || [])
    } catch (error) {
      console.error('Erreur chargement réservations:', error)
      toast.error('Erreur lors du chargement de vos réservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId)
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Annulation par le client'
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      toast.success('Réservation annulée avec succès')
      fetchBookings() // Refresh la liste
      
    } catch (error) {
      console.error('Erreur annulation:', error)
      toast.error('Erreur lors de l\'annulation')
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (amount: number, currency: string = 'MGA') => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <OptimizedSpinner size={32} />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Mes réservations</h1>
          <p className="text-muted-foreground">Gérez vos réservations et suivez leur statut</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">Aucune réservation</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Vous n'avez encore aucune réservation. Découvrez nos packs et réservez votre prochaine aventure !
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Mes réservations</h1>
        <p className="text-muted-foreground">
          {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6">
        {bookings.map((booking) => {
          const primaryImage = booking.packs.pack_images.find(img => img.is_primary)?.image_url
          const status = statusConfig[booking.status]
          const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
          
          return (
            <Card key={booking.id} className="overflow-hidden">
              <div className="md:flex">
                {/* Image du pack */}
                {primaryImage && (
                  <div className="md:w-48 h-48 md:h-auto">
                    <img 
                      src={primaryImage}
                      alt={booking.packs.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Contenu principal */}
                <div className="flex-1 p-6">
                  <CardHeader className="p-0 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{booking.packs.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          {booking.packs.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Réf: {booking.booking_reference}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 space-y-4">
                    {/* Informations de base */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.number_of_participants} participant{booking.number_of_participants > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.contact_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.contact_phone}</span>
                      </div>
                    </div>

                    {/* Prix et paiement */}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatPrice(booking.total_price, booking.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({formatPrice(booking.price_per_person, booking.currency)} / pers.)
                        </span>
                      </div>
                      
                      {booking.payments.length > 0 && (
                        <Badge variant="outline">
                          Paiement: {booking.payments[0]?.status}
                        </Badge>
                      )}
                    </div>

                    {/* Demandes spéciales */}
                    {booking.special_requests && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Demandes spéciales:</p>
                            <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    {canCancel && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                          >
                            {cancellingId === booking.id ? (
                              <OptimizedSpinner size={16} />
                            ) : (
                              'Annuler la réservation'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
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