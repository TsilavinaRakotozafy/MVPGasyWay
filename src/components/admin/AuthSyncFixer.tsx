import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Database,
  UserPlus,
  Settings
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { api } from '../../utils/api'

interface AuthUser {
  id: string
  email: string
  created_at: string
  user_metadata: any
}

interface DbUser {
  id: string
  email: string
  role: string
  status: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

interface SyncIssue {
  type: 'missing_in_users' | 'role_mismatch' | 'orphaned_user'
  auth_user?: AuthUser
  db_user?: DbUser
  description: string
}

export function AuthSyncFixer() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
  const [dbUsers, setDbUsers] = useState<DbUser[]>([])
  const [issues, setIssues] = useState<SyncIssue[]>([])
  const [stats, setStats] = useState({
    authCount: 0,
    dbCount: 0,
    synchronized: 0,
    issues: 0
  })

  const loadAuthUsers = async () => {
    try {
      // Utiliser Supabase Auth Admin API pour récupérer tous les utilisateurs
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) throw error

      const authUsers = data.users.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        user_metadata: user.user_metadata || {}
      }))

      setAuthUsers(authUsers)
      return authUsers
    } catch (error) {
      console.error('Erreur récupération auth users:', error)
      toast.error('Erreur récupération utilisateurs Auth')
      return []
    }
  }

  const loadDbUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, status, first_name, last_name, created_at')

      if (error) throw error

      setDbUsers(data || [])
      return data || []
    } catch (error) {
      console.error('Erreur récupération db users:', error)
      toast.error('Erreur récupération utilisateurs DB')
      return []
    }
  }

  const analyzeSync = async () => {
    setAnalyzing(true)
    
    try {
      const [authUsers, dbUsers] = await Promise.all([
        loadAuthUsers(),
        loadDbUsers()
      ])

      const foundIssues: SyncIssue[] = []

      // 1. Chercher les utilisateurs Auth qui n'ont pas d'entrée dans users
      authUsers.forEach(authUser => {
        const dbUser = dbUsers.find(u => u.id === authUser.id)
        if (!dbUser) {
          foundIssues.push({
            type: 'missing_in_users',
            auth_user: authUser,
            description: `Utilisateur ${authUser.email} existe dans Auth mais pas dans la table users`
          })
        }
      })

      // 2. Chercher les utilisateurs DB orphelins (sans Auth)
      dbUsers.forEach(dbUser => {
        const authUser = authUsers.find(u => u.id === dbUser.id)
        if (!authUser) {
          foundIssues.push({
            type: 'orphaned_user',
            db_user: dbUser,
            description: `Utilisateur ${dbUser.email} existe dans users mais pas dans Auth`
          })
        }
      })

      // 3. Chercher les incohérences de rôle
      authUsers.forEach(authUser => {
        const dbUser = dbUsers.find(u => u.id === authUser.id)
        if (dbUser) {
          const authRole = authUser.user_metadata?.role
          if (authRole && authRole !== dbUser.role) {
            foundIssues.push({
              type: 'role_mismatch',
              auth_user: authUser,
              db_user: dbUser,
              description: `Rôle incohérent: Auth=${authRole}, DB=${dbUser.role}`
            })
          }
        }
      })

      setIssues(foundIssues)
      setStats({
        authCount: authUsers.length,
        dbCount: dbUsers.length,
        synchronized: authUsers.length - foundIssues.filter(i => i.type === 'missing_in_users').length,
        issues: foundIssues.length
      })

      toast.success(`Analyse terminée: ${foundIssues.length} problème(s) trouvé(s)`)
      
    } catch (error) {
      console.error('Erreur analyse sync:', error)
      toast.error('Erreur lors de l\'analyse')
    } finally {
      setAnalyzing(false)
    }
  }

  const fixMissingUser = async (authUser: AuthUser) => {
    try {
      const userData = {
        id: authUser.id,
        email: authUser.email,
        role: authUser.user_metadata?.role || 'traveler',
        status: 'active',
        first_name: authUser.user_metadata?.first_name || null,
        last_name: authUser.user_metadata?.last_name || null,
        phone: authUser.user_metadata?.phone || null,
        gdpr_consent: authUser.user_metadata?.gdpr_consent ?? true,
        locale: authUser.user_metadata?.locale || 'fr',
        first_login_completed: authUser.user_metadata?.first_login_completed ?? false,
        created_at: authUser.created_at,
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .insert(userData)

      if (error) throw error

      toast.success(`Utilisateur ${authUser.email} synchronisé`)
      
      // Recharger l'analyse
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur correction utilisateur:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const fixRoleMismatch = async (authUser: AuthUser, dbUser: DbUser) => {
    try {
      // Utiliser le rôle de Auth comme référence
      const correctRole = authUser.user_metadata?.role || 'traveler'
      
      const { error } = await supabase
        .from('users')
        .update({ 
          role: correctRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbUser.id)

      if (error) throw error

      toast.success(`Rôle corrigé pour ${dbUser.email}: ${correctRole}`)
      
      // Recharger l'analyse
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur correction rôle:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const removeOrphanedUser = async (dbUser: DbUser) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', dbUser.id)

      if (error) throw error

      toast.success(`Utilisateur orphelin ${dbUser.email} supprimé`)
      
      // Recharger l'analyse
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur suppression orphelin:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const fixAllIssues = async () => {
    setLoading(true)
    
    try {
      for (const issue of issues) {
        switch (issue.type) {
          case 'missing_in_users':
            if (issue.auth_user) {
              await fixMissingUser(issue.auth_user)
            }
            break
          
          case 'role_mismatch':
            if (issue.auth_user && issue.db_user) {
              await fixRoleMismatch(issue.auth_user, issue.db_user)
            }
            break
          
          case 'orphaned_user':
            if (issue.db_user) {
              await removeOrphanedUser(issue.db_user)
            }
            break
        }
      }
      
      toast.success('Toutes les corrections appliquées')
      
    } catch (error) {
      console.error('Erreur corrections globales:', error)
      toast.error('Erreur lors des corrections')
    } finally {
      setLoading(false)
    }
  }

  const createTrigger = async () => {
    try {
      // Créer un trigger SQL pour synchroniser automatiquement les nouveaux utilisateurs
      const triggerSQL = `
        -- Fonction trigger pour synchroniser Auth avec users
        CREATE OR REPLACE FUNCTION sync_auth_user()
        RETURNS trigger AS $$
        BEGIN
          -- Insérer dans la table users quand un utilisateur est créé dans auth.users
          INSERT INTO public.users (
            id,
            email,
            role,
            status,
            first_name,
            last_name,
            phone,
            gdpr_consent,
            locale,
            first_login_completed,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'traveler'),
            'active',
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'phone',
            COALESCE((NEW.raw_user_meta_data->>'gdpr_consent')::boolean, true),
            COALESCE(NEW.raw_user_meta_data->>'locale', 'fr'),
            COALESCE((NEW.raw_user_meta_data->>'first_login_completed')::boolean, false),
            NEW.created_at,
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            updated_at = NOW();
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Créer le trigger s'il n'existe pas
        DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
        CREATE TRIGGER sync_auth_user_trigger
          AFTER INSERT OR UPDATE ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION sync_auth_user();
      `

      const { error } = await supabase.rpc('exec_sql', { sql: triggerSQL })

      if (error) throw error

      toast.success('Trigger de synchronisation automatique créé')
      
    } catch (error) {
      console.error('Erreur création trigger:', error)
      toast.error('Erreur: vérifiez que vous avez les permissions pour créer des triggers')
    }
  }

  useEffect(() => {
    analyzeSync()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Réparateur de Synchronisation Auth</h1>
          <p className="text-muted-foreground">
            Diagnostique et corrige les problèmes de synchronisation entre Supabase Auth et la table users
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={analyzeSync}
            disabled={analyzing}
            className="border-primary text-primary hover:bg-primary/5"
          >
            {analyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réanalyser
              </>
            )}
          </Button>
          
          {issues.length > 0 && (
            <Button 
              onClick={fixAllIssues}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Correction...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Tout Corriger
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <h1 className="mb-1">{stats.authCount}</h1>
                <p className="text-muted-foreground">Utilisateurs Auth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <h1 className="mb-1">{stats.dbCount}</h1>
                <p className="text-muted-foreground">Utilisateurs DB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <h1 className="mb-1">{stats.synchronized}</h1>
                <p className="text-muted-foreground">Synchronisés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h1 className="mb-1">{stats.issues}</h1>
                <p className="text-muted-foreground">Problèmes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Synchronisation Automatique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Créer un trigger PostgreSQL pour synchroniser automatiquement les nouveaux utilisateurs.
          </p>
          
          <Button 
            onClick={createTrigger}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Créer le Trigger de Sync Auto
          </Button>
        </CardContent>
      </Card>

      {/* Liste des problèmes */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <h2>Problèmes Détectés ({issues.length})</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {issues.map((issue, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        issue.type === 'missing_in_users' ? 'destructive' :
                        issue.type === 'role_mismatch' ? 'outline' : 'secondary'
                      }>
                        {issue.type === 'missing_in_users' ? 'Manquant en DB' :
                         issue.type === 'role_mismatch' ? 'Rôle incohérent' : 'Orphelin'}
                      </Badge>
                      {issue.auth_user && (
                        <span className="text-sm text-muted-foreground">
                          {issue.auth_user.email}
                        </span>
                      )}
                      {issue.db_user && !issue.auth_user && (
                        <span className="text-sm text-muted-foreground">
                          {issue.db_user.email}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{issue.description}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {issue.type === 'missing_in_users' && issue.auth_user && (
                      <Button 
                        size="sm" 
                        onClick={() => fixMissingUser(issue.auth_user!)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Créer en DB
                      </Button>
                    )}
                    
                    {issue.type === 'role_mismatch' && issue.auth_user && issue.db_user && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => fixRoleMismatch(issue.auth_user!, issue.db_user!)}
                        className="border-primary text-primary hover:bg-primary/5"
                      >
                        Corriger Rôle
                      </Button>
                    )}
                    
                    {issue.type === 'orphaned_user' && issue.db_user && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => removeOrphanedUser(issue.db_user!)}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {issues.length === 0 && !analyzing && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="mb-2">Synchronisation parfaite !</h3>
            <p className="text-muted-foreground">
              Tous les utilisateurs Auth sont correctement synchronisés avec la table users.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}