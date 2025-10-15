import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { Bell, Send, Users, Calendar, Filter, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface Notification {
  id: string
  user_id: string
  type: 'booking' | 'payment' | 'review' | 'system' | 'marketing' | 'reminder'
  title: string
  message: string
  action_url?: string
  status: 'unread' | 'read' | 'archived'
  created_at: string
  expires_at?: string
  users: {
    email: string
    first_name: string
    last_name: string
  }
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

const notificationTypes = [
  { value: 'booking', label: 'Réservation', color: 'bg-blue-100 text-blue-800' },
  { value: 'payment', label: 'Paiement', color: 'bg-green-100 text-green-800' },
  { value: 'review', label: 'Avis', color: 'bg-purple-100 text-purple-800' },
  { value: 'system', label: 'Système', color: 'bg-gray-100 text-gray-800' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
  { value: 'reminder', label: 'Rappel', color: 'bg-yellow-100 text-yellow-800' }
]

const statusConfig = {
  unread: { label: 'Non lu', color: 'bg-red-100 text-red-800' },
  read: { label: 'Lu', color: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-800' }
}

export function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<{
    type?: string
    status?: string
    search?: string
  }>({})
  
  // Formulaire de nouvelle notification
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as const,
    action_url: '',
    recipient_type: 'all', // 'all', 'specific', 'role'
    specific_users: [] as string[],
    role_filter: 'traveler',
    expires_in_days: 7
  })

  useEffect(() => {
    Promise.all([
      fetchNotifications(),
      fetchUsers()
    ])
  }, [])

  const fetchNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          users (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      // Appliquer les filtres
      if (filter.type) {
        query = query.eq('type', filter.type)
      }
      if (filter.status) {
        query = query.eq('status', filter.status)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredData = data || []
      
      // Filtrage par recherche texte
      if (filter.search) {
        const search = filter.search.toLowerCase()
        filteredData = filteredData.filter(notif => 
          notif.title.toLowerCase().includes(search) ||
          notif.message.toLowerCase().includes(search) ||
          notif.users?.email.toLowerCase().includes(search)
        )
      }

      setNotifications(filteredData)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      toast.error('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .order('first_name')

      if (error) throw error
      
      // Transformer les données pour inclure le nom complet
      const usersWithName = (data || []).map(user => ({
        ...user,
        name: `${user.first_name} ${user.last_name}`
      }))
      
      setUsers(usersWithName)
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error)
    }
  }

  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error('Le titre et le message sont requis')
      return
    }

    setSending(true)
    try {
      let targetUsers: string[] = []

      // Déterminer les destinataires
      if (newNotification.recipient_type === 'all') {
        targetUsers = users.map(u => u.id)
      } else if (newNotification.recipient_type === 'specific') {
        targetUsers = newNotification.specific_users
      } else if (newNotification.recipient_type === 'role') {
        targetUsers = users.filter(u => u.role === newNotification.role_filter).map(u => u.id)
      }

      if (targetUsers.length === 0) {
        toast.error('Aucun destinataire sélectionné')
        return
      }

      // Calculer la date d'expiration
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newNotification.expires_in_days)

      // Créer les notifications pour chaque utilisateur
      const notificationsToInsert = targetUsers.map(userId => ({
        user_id: userId,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        action_url: newNotification.action_url || null,
        expires_at: expiresAt.toISOString()
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (error) throw error

      toast.success(`Notification envoyée à ${targetUsers.length} utilisateur${targetUsers.length > 1 ? 's' : ''}`)
      
      // Reset du formulaire
      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        action_url: '',
        recipient_type: 'all',
        specific_users: [],
        role_filter: 'traveler',
        expires_in_days: 7
      })
      
      fetchNotifications()

    } catch (error) {
      console.error('Erreur envoi notification:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Supprimer cette notification ?')) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      toast.success('Notification supprimée')
      fetchNotifications()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getTypeConfig = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <OptimizedSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Gestion des notifications</h1>
          <p className="text-muted-foreground">
            Envoyez et gérez les notifications utilisateurs
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Envoyer une notification</DialogTitle>
              <DialogDescription>
                Créez et envoyez une notification aux utilisateurs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Informations de base */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({...prev, title: e.target.value}))}
                    placeholder="Titre de la notification..."
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({...prev, message: e.target.value}))}
                    placeholder="Contenu du message..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value: any) => setNewNotification(prev => ({...prev, type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="action_url">URL d'action (optionnel)</Label>
                    <Input
                      id="action_url"
                      value={newNotification.action_url}
                      onChange={(e) => setNewNotification(prev => ({...prev, action_url: e.target.value}))}
                      placeholder="/bookings, /profile..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Destinataires */}
              <div className="space-y-4">
                <h4 className="font-medium">Destinataires</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all_users"
                      name="recipients"
                      checked={newNotification.recipient_type === 'all'}
                      onChange={() => setNewNotification(prev => ({...prev, recipient_type: 'all'}))}
                    />
                    <Label htmlFor="all_users">Tous les utilisateurs ({users.length})</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="by_role"
                      name="recipients"
                      checked={newNotification.recipient_type === 'role'}
                      onChange={() => setNewNotification(prev => ({...prev, recipient_type: 'role'}))}
                    />
                    <Label htmlFor="by_role">Par rôle:</Label>
                    {newNotification.recipient_type === 'role' && (
                      <Select
                        value={newNotification.role_filter}
                        onValueChange={(value) => setNewNotification(prev => ({...prev, role_filter: value}))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="traveler">Voyageurs</SelectItem>
                          <SelectItem value="admin">Administrateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Options */}
              <div>
                <Label htmlFor="expires">Expire dans (jours)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="365"
                  value={newNotification.expires_in_days}
                  onChange={(e) => setNewNotification(prev => ({...prev, expires_in_days: parseInt(e.target.value) || 7}))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSendNotification} disabled={sending}>
                {sending ? (
                  <OptimizedSpinner size={16} />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Titre, message, email..."
                value={filter.search || ''}
                onChange={(e) => setFilter(prev => ({...prev, search: e.target.value}))}
              />
            </div>
            
            <div>
              <Label>Type</Label>
              <Select
                value={filter.type || 'all'}
                onValueChange={(value) => setFilter(prev => ({...prev, type: value === 'all' ? undefined : value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Statut</Label>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) => setFilter(prev => ({...prev, status: value === 'all' ? undefined : value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="unread">Non lus</SelectItem>
                  <SelectItem value="read">Lus</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchNotifications} variant="outline" className="w-full">
                Appliquer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-medium">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <Bell className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Non lues</p>
              <p className="text-2xl font-medium">
                {notifications.filter(n => n.status === 'unread').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
              <p className="text-2xl font-medium">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              <p className="text-2xl font-medium">
                {notifications.filter(n => {
                  const today = new Date().toDateString()
                  const notifDate = new Date(n.created_at).toDateString()
                  return today === notifDate
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications récentes</CardTitle>
          <CardDescription>
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">Aucune notification</h3>
              <p className="text-muted-foreground">
                Aucune notification ne correspond aux filtres sélectionnés
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const typeConfig = getTypeConfig(notification.type)
                const status = statusConfig[notification.status]
                
                return (
                  <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Pour: {notification.users.first_name} {notification.users.last_name} ({notification.users.email})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm">{notification.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.created_at)}
                          {notification.expires_at && (
                            <span> • Expire le {formatDate(notification.expires_at)}</span>
                          )}
                        </p>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}