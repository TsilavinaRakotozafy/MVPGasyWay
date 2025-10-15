import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { AlertTriangle, Search, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'

interface DuplicateUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  last_login: string
  first_name: string | null
  last_name: string | null
}

interface DuplicateGroup {
  email: string
  users: DuplicateUser[]
  count: number
}

export function UsersDuplicatesFixer() {
  const [loading, setLoading] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [fixing, setFixing] = useState<string | null>(null)

  const scanForDuplicates = async () => {
    setLoading(true)
    try {
      console.log('🔍 Recherche de doublons dans la table users...')
      
      // Récupérer tous les utilisateurs
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, created_at, updated_at, last_login, first_name, last_name')
        .order('email')

      if (error) throw error

      // Grouper par email
      const emailGroups: { [email: string]: DuplicateUser[] } = {}
      users?.forEach(user => {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = []
        }
        emailGroups[user.email].push(user)
      })

      // Filtrer seulement les groupes avec des doublons
      const duplicateGroups: DuplicateGroup[] = Object.entries(emailGroups)
        .filter(([_, userList]) => userList.length > 1)
        .map(([email, userList]) => ({
          email,
          users: userList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          count: userList.length
        }))

      setDuplicates(duplicateGroups)
      
      if (duplicateGroups.length === 0) {
        toast.success('Aucun doublon détecté dans la table users ! ✨')
      } else {
        toast.warning(`${duplicateGroups.length} groupe(s) de doublons détectés`)
      }

      console.log('📊 Résultats scan:', {
        totalUsers: users?.length || 0,
        duplicateGroups: duplicateGroups.length,
        duplicateGroups
      })

    } catch (error: any) {
      console.error('❌ Erreur scan doublons:', error)
      toast.error('Erreur lors du scan des doublons')
    } finally {
      setLoading(false)
    }
  }

  const fixDuplicates = async (group: DuplicateGroup) => {
    setFixing(group.email)
    try {
      console.log(`🔧 Correction doublons pour ${group.email}...`)
      
      // Garder le plus ancien (premier créé) et supprimer les autres
      const [keepUser, ...toDelete] = group.users

      console.log('👤 Utilisateur à conserver:', keepUser)
      console.log('🗑️ Utilisateurs à supprimer:', toDelete)

      // Supprimer les doublons un par un
      for (const user of toDelete) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id)

        if (error) {
          console.error(`❌ Erreur suppression ${user.id}:`, error)
          throw error
        }
        
        console.log(`✅ Supprimé utilisateur doublon: ${user.id}`)
      }

      toast.success(`Doublons corrigés pour ${group.email} ! Gardé le plus ancien compte.`)
      
      // Rafraîchir la liste
      await scanForDuplicates()

    } catch (error: any) {
      console.error('❌ Erreur correction doublons:', error)
      toast.error('Erreur lors de la correction des doublons')
    } finally {
      setFixing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Correcteur de Doublons Utilisateurs
          </CardTitle>
          <CardDescription>
            Détecte et corrige les comptes utilisateurs en double dans la table users.
            Cette situation peut causer l'erreur "Cannot coerce the result to a single JSON object".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={scanForDuplicates}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Analyse en cours...' : 'Scanner les doublons'}
          </Button>

          {duplicates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <h4>Doublons détectés ({duplicates.length} groupes)</h4>
              </div>

              {duplicates.map((group) => (
                <Card key={group.email} className="border-orange-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {group.email}
                        <Badge variant="destructive">{group.count} comptes</Badge>
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => fixDuplicates(group)}
                        disabled={fixing === group.email}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {fixing === group.email ? (
                          'Correction...'
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Corriger
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.users.map((user, index) => (
                        <div 
                          key={user.id}
                          className={`p-3 rounded border ${
                            index === 0 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={index === 0 ? 'default' : 'destructive'}>
                                  {index === 0 ? 'À GARDER' : 'À SUPPRIMER'}
                                </Badge>
                                <span className="font-mono text-sm">{user.id}</span>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><strong>Nom:</strong> {user.first_name} {user.last_name}</p>
                                <p><strong>Créé:</strong> {formatDate(user.created_at)}</p>
                                <p><strong>Modifié:</strong> {formatDate(user.updated_at)}</p>
                                {user.last_login && (
                                  <p><strong>Dernière connexion:</strong> {formatDate(user.last_login)}</p>
                                )}
                              </div>
                            </div>
                            {index === 0 && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <strong>Stratégie:</strong> Le compte le plus ancien sera conservé, 
                      les autres seront supprimés définitivement.
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {duplicates.length === 0 && !loading && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p>Aucun doublon détecté. La table users est propre !</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Les doublons peuvent survenir lors de migrations ou de problèmes de synchronisation</p>
          <p>• Cette correction garde toujours le compte le plus ancien</p>
          <p>• L'opération est définitive, pensez à faire une sauvegarde si nécessaire</p>
          <p>• Après correction, l'erreur "Cannot coerce the result to a single JSON object" devrait disparaître</p>
        </CardContent>
      </Card>
    </div>
  )
}