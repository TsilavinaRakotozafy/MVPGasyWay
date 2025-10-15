import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { toast } from 'sonner@2.0.3'
import { 
  AlertTriangle, 
  CheckCircle, 
  User, 
  RefreshCw,
  Database,
  RotateCcw,
  Users,
  Settings
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface UserFirstLoginStatus {
  id: string
  email: string
  first_name?: string
  last_name?: string
  first_login_completed: boolean
  created_at: string
  bio?: string
  profile_picture_url?: string
  interests_count: number
}

export function FirstLoginCompletedFixer() {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [users, setUsers] = useState<UserFirstLoginStatus[]>([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    needsSetup: 0,
    withProfile: 0,
    withoutProfile: 0
  })

  const loadUsersStatus = async () => {
    setLoading(true)
    try {
      console.log('🔍 Chargement du statut first_login_completed des utilisateurs...')

      // Récupérer tous les utilisateurs avec leurs informations de profil
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          first_login_completed,
          created_at,
          bio,
          profile_picture_url
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        setUsers([])
        toast.warning('Aucun utilisateur trouvé')
        return
      }

      // Pour chaque utilisateur, compter ses centres d'intérêt
      const usersWithInterests = await Promise.all(
        usersData.map(async (user) => {
          try {
            const { data: interestsData, error: interestsError } = await supabase
              .from('user_interests')
              .select('interest_id')
              .eq('user_id', user.id)

            const interests_count = interestsError ? 0 : (interestsData?.length || 0)

            return {
              ...user,
              interests_count
            }
          } catch (error) {
            console.warn(`Erreur comptage intérêts pour ${user.email}:`, error)
            return {
              ...user,
              interests_count: 0
            }
          }
        })
      )

      setUsers(usersWithInterests)

      // Calculer les statistiques
      const total = usersWithInterests.length
      const completed = usersWithInterests.filter(u => u.first_login_completed === true).length
      const needsSetup = usersWithInterests.filter(u => u.first_login_completed === false).length
      const withProfile = usersWithInterests.filter(u => u.bio || u.profile_picture_url || u.interests_count > 0).length
      const withoutProfile = total - withProfile

      setStats({
        total,
        completed,
        needsSetup,
        withProfile,
        withoutProfile
      })

      console.log('✅ Statut utilisateurs chargé:', {
        total,
        completed,
        needsSetup,
        withProfile,
        withoutProfile
      })

      toast.success(`${total} utilisateurs analysés`)
    } catch (error: any) {
      console.error('❌ Erreur chargement statut utilisateurs:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetUsersToNeedSetup = async () => {
    if (!confirm('Êtes-vous sûr de vouloir marquer TOUS les utilisateurs comme ayant besoin du setup de première connexion ? Cette action est irréversible.')) {
      return
    }

    setActionLoading(true)
    try {
      console.log('🔄 Remise à zéro du statut first_login_completed pour tous les utilisateurs...')

      const { error } = await supabase
        .from('users')
        .update({ 
          first_login_completed: false,
          updated_at: new Date().toISOString()
        })
        .neq('role', 'admin') // Ne pas toucher aux comptes admin

      if (error) throw error

      console.log('✅ Tous les utilisateurs (sauf admin) marqués comme ayant besoin du setup')
      toast.success('Tous les utilisateurs vont maintenant voir le setup de première connexion')
      
      // Recharger les données
      await loadUsersStatus()
    } catch (error: any) {
      console.error('❌ Erreur reset statut utilisateurs:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const resetSpecificUsersToNeedSetup = async () => {
    if (!confirm('Voulez-vous marquer comme "besoin setup" uniquement les utilisateurs qui n\'ont PAS de profil complet (pas de bio, photo ou intérêts) ?')) {
      return
    }

    setActionLoading(true)
    try {
      console.log('🔄 Reset sélectif des utilisateurs sans profil complet...')

      // Identifier les utilisateurs sans profil complet
      const usersToReset = users.filter(user => 
        !user.bio && 
        !user.profile_picture_url && 
        user.interests_count === 0
      )

      if (usersToReset.length === 0) {
        toast.info('Aucun utilisateur sans profil complet trouvé')
        return
      }

      const userIds = usersToReset.map(u => u.id)

      const { error } = await supabase
        .from('users')
        .update({ 
          first_login_completed: false,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)

      if (error) throw error

      console.log(`✅ ${usersToReset.length} utilisateurs sans profil complet marqués pour setup`)
      toast.success(`${usersToReset.length} utilisateurs sans profil vont voir le setup`)
      
      // Recharger les données
      await loadUsersStatus()
    } catch (error: any) {
      console.error('❌ Erreur reset sélectif:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const markAllAsCompleted = async () => {
    if (!confirm('Voulez-vous marquer TOUS les utilisateurs comme ayant terminé le setup ? Ils ne verront plus jamais le FirstLoginSetup.')) {
      return
    }

    setActionLoading(true)
    try {
      console.log('🔄 Marquage de tous les utilisateurs comme setup terminé...')

      const { error } = await supabase
        .from('users')
        .update({ 
          first_login_completed: true,
          updated_at: new Date().toISOString()
        })
        .neq('role', 'admin') // Ne pas toucher aux admin

      if (error) throw error

      console.log('✅ Tous les utilisateurs marqués comme setup terminé')
      toast.success('Tous les utilisateurs sont maintenant marqués comme setup terminé')
      
      // Recharger les données
      await loadUsersStatus()
    } catch (error: any) {
      console.error('❌ Erreur marquage setup terminé:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    loadUsersStatus()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Correcteur First Login Completed
          </CardTitle>
          <CardDescription>
            Diagnostic et correction du statut first_login_completed des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-xs text-blue-700">Total</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                <div className="text-xs text-green-700">Setup terminé</div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">{stats.needsSetup}</div>
                <div className="text-xs text-orange-700">Besoin setup</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">{stats.withProfile}</div>
                <div className="text-xs text-purple-700">Avec profil</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-900">{stats.withoutProfile}</div>
                <div className="text-xs text-red-700">Sans profil</div>
              </div>
            </div>

            {/* Actions de correction */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Actions de correction</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  onClick={resetUsersToNeedSetup}
                  disabled={loading || actionLoading}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center text-center"
                >
                  <RotateCcw className="h-4 w-4 mb-1" />
                  <span className="text-xs">Reset TOUS vers "besoin setup"</span>
                </Button>
                
                <Button 
                  onClick={resetSpecificUsersToNeedSetup}
                  disabled={loading || actionLoading}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center text-center"
                >
                  <AlertTriangle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Reset SEULEMENT sans profil</span>
                </Button>
                
                <Button 
                  onClick={markAllAsCompleted}
                  disabled={loading || actionLoading}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center text-center"
                >
                  <CheckCircle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Marquer TOUS comme terminé</span>
                </Button>
              </div>

              <Button 
                onClick={loadUsersStatus}
                disabled={loading || actionLoading}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser les données
              </Button>
            </div>

            {/* Liste des utilisateurs */}
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Chargement des utilisateurs...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium">Détail par utilisateur ({users.length})</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.email}</span>
                          {user.first_name && user.last_name && (
                            <span className="text-sm text-gray-600">({user.first_name} {user.last_name})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Créé: {new Date(user.created_at).toLocaleDateString()}</span>
                          <span>Intérêts: {user.interests_count}</span>
                          {user.bio && <Badge variant="outline" className="text-xs">Bio</Badge>}
                          {user.profile_picture_url && <Badge variant="outline" className="text-xs">Photo</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.first_login_completed ? (
                          <Badge variant="default" className="text-xs">Setup terminé</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Besoin setup</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Explications</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>first_login_completed = false</strong> → L'utilisateur verra FirstLoginSetup à sa prochaine connexion</li>
          <li><strong>first_login_completed = true</strong> → L'utilisateur ne verra plus jamais FirstLoginSetup</li>
          <li><strong>"Avec profil"</strong> → Utilisateur ayant bio, photo ou intérêts (probablement déjà passé par le setup)</li>
          <li><strong>"Sans profil"</strong> → Utilisateur vide (devrait probablement faire le setup)</li>
        </ul>
      </div>
    </div>
  )
}