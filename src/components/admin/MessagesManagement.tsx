import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { Input } from '../ui/input'
import { MessagingSystem } from '../messaging/MessagingSystem'
import { 
  MessageCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Users,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface ConversationStats {
  id: string
  type: 'booking_support' | 'general_support' | 'pack_inquiry' | 'payment_issue' | 'emergency'
  title: string | null
  user_id: string
  user_name: string
  user_email: string
  status: 'active' | 'resolved' | 'closed' | 'escalated'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  created_at: string
  booking_id?: string
  pack_id?: string
}

interface AdminStats {
  total_conversations: number
  active_conversations: number
  pending_responses: number
  resolved_today: number
}

export const MessagesManagement: React.FC = () => {
  const { user, supabase } = useAuth()
  const [conversations, setConversations] = useState<ConversationStats[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!supabase) return

    try {
      const [totalResult, activeResult, pendingResult, resolvedResult] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).in('status', ['active', 'escalated']),
        supabase.from('conversations').select('id', { count: 'exact', head: true })
          .eq('status', 'resolved')
          .gte('updated_at', new Date().toISOString().split('T')[0])
      ])

      setStats({
        total_conversations: totalResult.count || 0,
        active_conversations: activeResult.count || 0,
        pending_responses: pendingResult.count || 0,
        resolved_today: resolvedResult.count || 0
      })
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }, [supabase])

  // Charger les conversations avec détails utilisateur
  const loadConversations = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          users!conversations_user_id_fkey(first_name, last_name, email)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      // Filtres
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority)
      }

      const { data, error } = await query

      if (error) throw error

      // Enrichir avec compteurs non lus et recherche
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { data: unreadCount } = await supabase
            .rpc('get_unread_messages_count', {
              p_user_id: user?.id,
              p_conversation_id: conv.id
            })

          const userInfo = conv.users || {}
          const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim()
          
          return {
            ...conv,
            user_name: userName || 'Utilisateur',
            user_email: userInfo.email || '',
            unread_count: unreadCount || 0
          }
        })
      )

      // Filtrer par recherche
      const filteredConversations = enrichedConversations.filter((conv: ConversationStats) => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
          conv.user_name.toLowerCase().includes(searchLower) ||
          conv.user_email.toLowerCase().includes(searchLower) ||
          (conv.title || '').toLowerCase().includes(searchLower) ||
          (conv.last_message_preview || '').toLowerCase().includes(searchLower)
        )
      })

      setConversations(filteredConversations)
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setLoading(false)
    }
  }, [supabase, user, filterStatus, filterPriority, searchTerm])

  // Mettre à jour le statut d'une conversation
  const updateConversationStatus = useCallback(async (conversationId: string, status: string) => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (error) throw error

      await loadConversations()
      await loadStats()
      toast.success(`Conversation marquée comme ${status}`)
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }, [supabase, loadConversations, loadStats])

  // Assigner une conversation à l'admin connecté
  const assignConversation = useCallback(async (conversationId: string) => {
    if (!supabase || !user) return

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ admin_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (error) throw error

      await loadConversations()
      toast.success('Conversation assignée')
    } catch (error) {
      console.error('Erreur assignation:', error)
      toast.error('Erreur lors de l\'assignation')
    }
  }, [supabase, user, loadConversations])

  // Temps réel
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('admin_conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          loadConversations()
          loadStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadConversations, loadStats])

  // Charger les données initiales
  useEffect(() => {
    loadStats()
    loadConversations()
  }, [loadStats, loadConversations])

  // Formatage priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'normal': return <Clock className="w-4 h-4 text-blue-500" />
      case 'low': return <Clock className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 1) return 'À l\'instant'
    if (diffHours < 24) return `Il y a ${Math.floor(diffHours)}h`
    return date.toLocaleDateString('fr-FR')
  }

  if (selectedConversation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Messages</h2>
            <p className="text-gray-600">Gestion des conversations client</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedConversation(null)}
          >
            ← Retour à la liste
          </Button>
        </div>

        <MessagingSystem 
          initialConversationId={selectedConversation}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-gray-600">Gestion des conversations client</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_conversations}</p>
                  <p className="text-sm text-gray-600">Total conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active_conversations}</p>
                  <p className="text-sm text-gray-600">Actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending_responses}</p>
                  <p className="text-sm text-gray-600">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.resolved_today}</p>
                  <p className="text-sm text-gray-600">Résolues aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, email ou message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="resolved">Résolues</option>
                <option value="closed">Fermées</option>
                <option value="escalated">Escaladées</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Toutes priorités</option>
                <option value="urgent">Urgent</option>
                <option value="high">Élevée</option>
                <option value="normal">Normale</option>
                <option value="low">Faible</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Conversations ({conversations.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="mx-auto mb-4 w-12 h-12" />
              <p>Aucune conversation trouvée</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {conversation.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium truncate">
                            {conversation.user_name}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.title || conversation.type}
                        </p>
                        
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.last_message_preview || 'Aucun message'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(conversation.priority)}
                          <Badge 
                            variant="outline"
                            className={`text-xs ${getPriorityColor(conversation.priority)}`}
                          >
                            {conversation.priority}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-1">
                          {getStatusIcon(conversation.status)}
                          <span className="text-xs text-gray-500">
                            {conversation.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {conversation.last_message_at ? 
                            formatDate(conversation.last_message_at) : 
                            formatDate(conversation.created_at)
                          }
                        </p>
                        
                        <div className="flex space-x-1 mt-1">
                          {conversation.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateConversationStatus(conversation.id, 'resolved')
                              }}
                              className="text-xs"
                            >
                              Résoudre
                            </Button>
                          )}
                          
                          {!conversation.admin_id && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                assignConversation(conversation.id)
                              }}
                              className="text-xs"
                            >
                              Assigner
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MessagesManagement