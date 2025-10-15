import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '../../contexts/AuthContextSQL'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { MessageCircle, Send, Clock, CheckCheck, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

// Types pour la messagerie
interface Conversation {
  id: string
  type: 'booking_support' | 'general_support' | 'pack_inquiry' | 'payment_issue' | 'emergency'
  title: string | null
  user_id: string
  admin_id: string | null
  booking_id: string | null
  pack_id: string | null
  status: 'active' | 'resolved' | 'closed' | 'escalated'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
  updated_at: string
  unread_count?: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: 'traveler' | 'admin'
  content: string
  message_type: 'text' | 'image' | 'file' | 'location' | 'system'
  attachments: any | null
  metadata: any | null
  is_system_message: boolean
  is_edited: boolean
  edited_at: string | null
  created_at: string
  is_read?: boolean
  sender_name?: string
}

interface MessagingSystemProps {
  bookingId?: string
  packId?: string
  initialConversationId?: string
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({
  bookingId,
  packId,
  initialConversationId
}) => {
  const { user, supabase } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialConversationId || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ⚡ TEMPS RÉEL - Subscription aux conversations
  useEffect(() => {
    if (!user || !supabase) return

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: user.role === 'admin' ? '' : `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Conversation change:', payload)
          loadConversations() // Recharger les conversations
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ⚡ TEMPS RÉEL - Subscription aux messages
  useEffect(() => {
    if (!activeConversation || !supabase) return

    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation}`
        },
        (payload) => {
          console.log('New message:', payload)
          const newMessage = payload.new as Message
          
          // Ajouter le nom de l'expéditeur
          setMessages(prev => [...prev, {
            ...newMessage,
            sender_name: newMessage.sender_role === 'admin' ? 'Support GasyWay' : 'Vous',
            is_read: newMessage.sender_id === user?.id
          }])
          
          // Marquer comme lu si c'est son propre message
          if (newMessage.sender_id !== user?.id) {
            markAsRead(newMessage.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation, supabase, user])

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!user || !supabase) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })

      // Filtrer selon le rôle
      if (user.role === 'traveler') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculer le nombre de messages non lus pour chaque conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: unreadCount } = await supabase
            .rpc('get_unread_messages_count', {
              p_user_id: user.id,
              p_conversation_id: conv.id
            })
          
          return {
            ...conv,
            unread_count: unreadCount || 0
          }
        })
      )

      setConversations(conversationsWithUnread)

      // Sélectionner la première conversation si aucune n'est active
      if (!activeConversation && conversationsWithUnread.length > 0) {
        setActiveConversation(conversationsWithUnread[0].id)
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setLoading(false)
    }
  }, [user, supabase, activeConversation])

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          message_read_status!left(user_id, read_at)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Enrichir avec informations de lecture et nom expéditeur
      const enrichedMessages = (data || []).map((msg: any) => ({
        ...msg,
        is_read: msg.message_read_status.some((rs: any) => rs.user_id === user?.id),
        sender_name: msg.sender_role === 'admin' ? 'Support GasyWay' : 
                    msg.sender_id === user?.id ? 'Vous' : 'Utilisateur'
      }))

      setMessages(enrichedMessages)

      // Marquer tous les messages non lus comme lus
      if (user) {
        await supabase.rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: user.id
        })
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
      toast.error('Erreur lors du chargement des messages')
    }
  }, [supabase, user])

  // Marquer un message comme lu
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user || !supabase) return

    try {
      await supabase
        .from('message_read_status')
        .upsert({ message_id: messageId, user_id: user.id })
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    }
  }, [user, supabase])

  // Envoyer un message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || !user || !supabase) return

    setSendingMessage(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: user.id,
          sender_role: user.role,
          content: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Erreur envoi message:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setSendingMessage(false)
    }
  }, [newMessage, activeConversation, user, supabase])

  // Créer une nouvelle conversation
  const createConversation = useCallback(async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .rpc('create_support_conversation', {
          p_user_id: user.id,
          p_booking_id: bookingId || null,
          p_pack_id: packId || null,
          p_title: 'Nouvelle demande de support',
          p_first_message: 'Bonjour, j\'ai besoin d\'aide concernant ma réservation.'
        })

      if (error) throw error

      const conversationId = data
      setActiveConversation(conversationId)
      await loadConversations()
      toast.success('Nouvelle conversation créée')
    } catch (error) {
      console.error('Erreur création conversation:', error)
      toast.error('Erreur lors de la création de la conversation')
    }
  }, [user, supabase, bookingId, packId, loadConversations])

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Charger les données initiales
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation)
    }
  }, [activeConversation, loadMessages])

  // Gestion du Enter pour envoyer
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Formatage de date
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    }
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }
    
    return date.toLocaleDateString('fr-FR')
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="mx-auto mb-4 w-12 h-12 text-gray-400" />
          <p>Connectez-vous pour accéder à la messagerie</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg border overflow-hidden">
      {/* 📋 Liste des conversations */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Messages</h3>
            {user.role === 'traveler' && (
              <Button
                size="sm"
                onClick={createConversation}
                className="text-xs"
              >
                Nouveau
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-73px)]">
          {loading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="mx-auto mb-2 w-8 h-8" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                  activeConversation === conversation.id ? 'bg-white border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {conversation.type === 'booking_support' ? '📋' : '💬'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {conversation.title || 'Support'}
                      </p>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {conversation.last_message_preview || 'Aucun message'}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-1">
                      {conversation.last_message_at ? 
                        formatDate(conversation.last_message_at) : 
                        formatDate(conversation.created_at)
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* 💬 Zone de messages */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    {conversations.find(c => c.id === activeConversation)?.title || 'Support'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Support GasyWay • En ligne
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {conversations.find(c => c.id === activeConversation)?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender_id === user.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.created_at)}
                        </span>
                        {message.sender_id === user.id && (
                          message.is_read ? (
                            <CheckCheck className="w-3 h-3 opacity-70" />
                          ) : (
                            <Clock className="w-3 h-3 opacity-70" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input message */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 w-12 h-12" />
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagingSystem