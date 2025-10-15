import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { AlertTriangle, CheckCircle, Users, Database, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'

interface UserSyncStatus {
  inAuth: boolean
  inDatabase: boolean
  hasData: boolean
  userData?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    status?: string
    role?: string
  }
  authData?: {
    id: string
    email: string
    created_at: string
  }
}

export function UserSyncChecker() {
  const { user, refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<UserSyncStatus | null>(null)

  const checkUserSync = async () => {
    if (!user?.id) {
      toast.error("Aucun utilisateur connecté")
      return
    }

    setChecking(true)
    setStatus(null)

    try {
      // 1. Vérifier dans Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      // 2. Vérifier dans la table users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, status, role, created_at')
        .eq('id', user.id)
        .maybeSingle()

      const syncStatus: UserSyncStatus = {
        inAuth: !authError && !!authUser,
        inDatabase: !dbError && !!dbUser,
        hasData: !!(dbUser?.first_name || dbUser?.last_name || dbUser?.phone),
        userData: dbUser || undefined,
        authData: authUser ? {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at
        } : undefined
      }

      setStatus(syncStatus)

      // Messages informatifs
      if (syncStatus.inAuth && syncStatus.inDatabase && syncStatus.hasData) {
        toast.success("✅ Utilisateur parfaitement synchronisé !")
      } else if (syncStatus.inAuth && syncStatus.inDatabase && !syncStatus.hasData) {
        toast.warning("⚠️ Utilisateur en base mais sans données personnelles")
      } else if (syncStatus.inAuth && !syncStatus.inDatabase) {
        toast.error("❌ Utilisateur manquant dans la table users")
      } else {
        toast.error("❌ Problème de synchronisation détecté")
      }

    } catch (error: any) {
      console.error("Erreur vérification sync:", error)
      toast.error("Erreur lors de la vérification")
    } finally {
      setChecking(false)
    }
  }

  const syncUserToDatabase = async () => {
    if (!user?.id || !user?.email) {
      toast.error("Données utilisateur insuffisantes")
      return
    }

    setSyncing(true)

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          status: 'active',
          role: 'traveler',
          first_name: null,
          last_name: null,
          phone: null,
          bio: null,
          profile_picture_url: null,
          first_login_completed: false,
          gdpr_consent: true,
          locale: 'fr',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      toast.success("✅ Utilisateur synchronisé avec succès !")
      
      // Rafraîchir l'état
      await refreshUser()
      await checkUserSync()

    } catch (error: any) {
      console.error("Erreur synchronisation:", error)
      toast.error(error.message || "Erreur lors de la synchronisation")
    } finally {
      setSyncing(false)
    }
  }

  const getStatusIcon = () => {
    if (!status) return null

    if (status.inAuth && status.inDatabase && status.hasData) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status.inAuth && status.inDatabase) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = () => {
    if (!status) return 'secondary'
    
    if (status.inAuth && status.inDatabase && status.hasData) {
      return 'default'
    } else if (status.inAuth && status.inDatabase) {
      return 'secondary'
    } else {
      return 'destructive'
    }
  }

  const getStatusText = () => {
    if (!status) return 'Non vérifié'
    
    if (status.inAuth && status.inDatabase && status.hasData) {
      return 'Parfaitement synchronisé'
    } else if (status.inAuth && status.inDatabase && !status.hasData) {
      return 'En base mais sans données'
    } else if (status.inAuth && !status.inDatabase) {
      return 'Manquant dans table users'
    } else {
      return 'Problème de synchronisation'
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Vérificateur de Synchronisation
        </CardTitle>
        <CardDescription>
          Vérifiez si votre compte est correctement synchronisé entre l'authentification et la base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={checkUserSync}
            disabled={checking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Vérifier
              </>
            )}
          </Button>

          {status && !status.inDatabase && (
            <Button 
              onClick={syncUserToDatabase}
              disabled={syncing}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Synchroniser
                </>
              )}
            </Button>
          )}
        </div>

        {status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">État de synchronisation</span>
              </div>
              <Badge variant={getStatusColor() as any}>
                {getStatusText()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Supabase Auth
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <Badge variant={status.inAuth ? 'default' : 'destructive'}>
                      {status.inAuth ? 'Connecté' : 'Problème'}
                    </Badge>
                  </div>
                  {status.authData && (
                    <>
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono text-xs">{status.authData.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="text-xs">{status.authData.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" />
                  Table Users
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <Badge variant={status.inDatabase ? 'default' : 'destructive'}>
                      {status.inDatabase ? 'Présent' : 'Manquant'}
                    </Badge>
                  </div>
                  {status.userData && (
                    <>
                      <div className="flex justify-between">
                        <span>Prénom:</span>
                        <span className="text-xs">{status.userData.first_name || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nom:</span>
                        <span className="text-xs">{status.userData.last_name || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Téléphone:</span>
                        <span className="text-xs">{status.userData.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rôle:</span>
                        <Badge variant="secondary" className="text-xs">
                          {status.userData.role}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {!status.inDatabase && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Problème détecté :</strong> Votre compte existe dans l'authentification 
                  mais pas dans notre base de données. Cliquez sur "Synchroniser" pour corriger.
                </p>
              </div>
            )}

            {status.inDatabase && !status.hasData && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Action recommandée :</strong> Votre compte existe en base mais sans 
                  données personnelles. Remplissez vos informations dans la page profil.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}