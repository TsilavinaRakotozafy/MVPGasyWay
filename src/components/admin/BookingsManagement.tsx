import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { toast } from 'sonner@2.0.3'
import { safeMultiFieldSearch } from '../../utils/safeSearch'
import { 
  Calendar,
  Users,
  DollarSign,
  Eye,
  Edit2,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  MapPin,
  Phone,
  Mail,
  Loader2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'

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
  updated_at: string
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
    duration_days: number
  }
  participants: Array<{
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string
    nationality?: string
  }>
  payment?: {
    id: string
    status: string
    amount: number
  }
}

export function BookingsManagement() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    if (user?.role === 'admin') {
      loadBookings()
    }
  }, [user])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:users (
            id,
            email,
            first_name,
            last_name
          ),
          pack:packs (
            id,
            title,
            location,
            duration_days
          ),
          participants:booking_participants (
            id,
            first_name,
            last_name,
            date_of_birth,
            nationality
          ),
          payment:payments (
            id,
            status,
            amount
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setBookings(data || [])
    } catch (error) {
      console.error('Erreur chargement réservations:', error)
      toast.error('Erreur lors du chargement des réservations')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId)
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancellation_reason = 'Annulé par l\'administrateur'
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any }
          : booking
      ))

      toast.success(`Réservation ${getStatusLabel(newStatus)}`)
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = safeMultiFieldSearch([
      booking?.booking_reference,
      booking?.contact_name,
      booking?.contact_email,
      booking?.pack?.title
    ], searchTerm)
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    let matchesDate = true
    if (dateFilter === 'upcoming') {
      matchesDate = new Date(booking.start_date) > new Date()
    } else if (dateFilter === 'past') {
      matchesDate = new Date(booking.end_date) < new Date()
    } else if (dateFilter === 'current') {
      const now = new Date()
      matchesDate = new Date(booking.start_date) <= now && new Date(booking.end_date) >= now
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      cancelled: 'Annulée',
      completed: 'Terminée',
      refunded: 'Remboursée'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      refunded: 'bg-purple-100 text-purple-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MG').format(price) + ' Ar'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
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
          <h1 className="text-2xl">Gestion des Réservations</h1>
          <p className="text-gray-600">Gérez toutes les réservations de la plateforme</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={loadBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par référence, client, email ou pack..."
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
            <SelectItem value="confirmed">Confirmées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
            <SelectItem value="refunded">Remboursées</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les dates</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="current">En cours</SelectItem>
            <SelectItem value="past">Passées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-sm text-gray-600">Total réservations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <p className="text-sm text-gray-600">Confirmées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {bookings.filter(b => b.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">Terminées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {bookings.reduce((sum, b) => sum + b.total_price, 0).toLocaleString()} Ar
            </div>
            <p className="text-sm text-gray-600">CA total</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des réservations */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des réservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
            <p className="text-gray-500">Aucune réservation ne correspond à vos critères de recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{booking.booking_reference}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                      {booking.payment && (
                        <Badge variant="outline">
                          Paiement: {booking.payment.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Pack: <span className="font-medium">{booking.pack.title}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Client: <span className="font-medium">{booking.contact_name}</span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(booking.total_price)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {booking.number_of_participants} participant{booking.number_of_participants > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{booking.pack.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{booking.contact_email}</span>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Demandes spéciales:</strong> {booking.special_requests}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Créée le {formatDate(booking.created_at)}</span>
                    {booking.participants.length > 0 && (
                      <span>• {booking.participants.length} participant{booking.participants.length > 1 ? 's' : ''} détaillé{booking.participants.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          disabled={actionLoading === booking.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmer
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          disabled={actionLoading === booking.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && new Date(booking.end_date) < new Date() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        disabled={actionLoading === booking.id}
                      >
                        Marquer terminée
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}