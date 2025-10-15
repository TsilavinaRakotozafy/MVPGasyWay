import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Gift,
  AlertCircle,
  Check,
  Trash2,
  Archive,
  Filter,
  Loader2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface Notification {
  id: string
  type: 'booking' | 'payment' | 'review' | 'system' | 'marketing' | 'reminder'
  title: string
  message: string
  action_url?: string
  status: 'unread' | 'read' | 'archived'
  created_at: string
  read_at?: string
  expires_at?: string
  booking_id?: string
  pack_id?: string
  review_id?: string
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      toast.error('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user?.id)

      if (error) {
        throw error
      }

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read' as const, read_at: new Date().toISOString() }
          : notif
      ))
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionLoading(null)
    }
  }

  const archiveNotification = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', notificationId)
        .eq('user_id', user?.id)

      if (error) {
        throw error
      }

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notification archivée')
    } catch (error) {
      console.error('Erreur archivage notification:', error)
      toast.error('Erreur lors de l\'archivage')
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => n.status === 'unread')
    if (unreadNotifications.length === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'unread')

      if (error) {
        throw error
      }

      setNotifications(prev => prev.map(notif => 
        notif.status === 'unread'
          ? { ...notif, status: 'read' as const, read_at: new Date().toISOString() }
          : notif
      ))

      toast.success(`${unreadNotifications.length} notification(s) marquée(s) comme lue(s)`)
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return notification.status === 'unread'
    if (filter === 'read') return notification.status === 'read'
    return true
  })

  const getTypeIcon = (type: string) => {
    const icons = {
      booking: Calendar,
      payment: CreditCard,
      review: MessageSquare,
      system: Settings,
      marketing: Gift,
      reminder: AlertCircle
    }
    const Icon = icons[type as keyof typeof icons] || Bell
    return <Icon className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    const colors = {
      booking: 'bg-blue-100 text-blue-800',
      payment: 'bg-green-100 text-green-800',
      review: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      marketing: 'bg-pink-100 text-pink-800',
      reminder: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      booking: 'Réservation',
      payment: 'Paiement',
      review: 'Avis',
      system: 'Système',
      marketing: 'Promo',
      reminder: 'Rappel'
    }
    return labels[type as keyof typeof labels] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Il y a moins d\'1h'
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else if (diffInHours < 48) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg mb-2">Connexion requise</h3>
        <p className="text-gray-500 mb-6">
          Vous devez être connecté pour voir vos notifications.
        </p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes vos notifications sont à jour'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Toutes ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Non lues ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          Lues ({notifications.filter(n => n.status === 'read').length})
        </Button>
      </div>

      {/* Liste des notifications */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Aucune notification' : `Aucune notification ${filter === 'unread' ? 'non lue' : 'lue'}`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Vous n\'avez encore reçu aucune notification.' 
                : 'Aucune notification ne correspond à ce filtre.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 ${
                notification.status === 'unread' 
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
                  : 'hover:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <Badge className={getTypeColor(notification.type)} size="sm">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {notification.status === 'unread' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-2 ${notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        
                        <div className="flex gap-1">
                          {notification.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="h-8 px-2"
                            >
                              {actionLoading === notification.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => archiveNotification(notification.id)}
                            disabled={actionLoading === notification.id}
                            className="h-8 px-2 text-gray-400 hover:text-red-600"
                          >
                            {actionLoading === notification.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Archive className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
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