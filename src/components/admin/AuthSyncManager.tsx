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
  Settings,
  Zap,
  Mail
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { EmailResendDiagnostic } from '../auth/EmailResendDiagnostic'

interface SyncAnalysis {
  authUsersCount: number
  dbUsersCount: number
  synchronizedCount: number
  issues: SyncIssue[]
}

interface SyncIssue {
  type: 'missing_in_users' | 'role_mismatch' | 'orphaned_user'
  user_id: string
  email: string
  description: string
  auth_metadata?: any
  db_data?: any
}

export function AuthSyncManager() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SyncAnalysis | null>(null)
  const [fixingAll, setFixingAll] = useState(false)
  const [creatingTrigger, setCreatingTrigger] = useState(false)
  const [showEmailDiagnostic, setShowEmailDiagnostic] = useState(false)

  // Faire l'analyse au chargement
  useEffect(() => {
    analyzeSync()
  }, [])

  const getAuthHeaders = () => {
    // Récupérer le token d'accès depuis le localStorage ou context
    const session = JSON.parse(localStorage.getItem('sb-' + projectId.split('-')[0] + '-auth-token') || '{}')
    const accessToken = session?.access_token
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const analyzeSync = async () => {
    setAnalyzing(true)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/analyze`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur analyse')
      }

      const analysisData = await response.json()
      setAnalysis(analysisData)
      
      toast.success(`Analyse terminée: ${analysisData.issues.length} problème(s) trouvé(s)`)
      
    } catch (error) {
      console.error('Erreur analyse sync:', error)
      toast.error(`Erreur analyse: ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const fixMissingUser = async (userId: string, email: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/fix-missing/${userId}`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      toast.success(`Utilisateur ${email} synchronisé`)
      await analyzeSync() // Recharger l'analyse
      
    } catch (error) {
      console.error('Erreur correction utilisateur:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const fixRoleMismatch = async (userId: string, email: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/fix-role/${userId}`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      toast.success(`Rôle corrigé pour ${email}`)
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur correction rôle:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const removeOrphanedUser = async (userId: string, email: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/remove-orphan/${userId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      toast.success(`Utilisateur orphelin ${email} supprimé`)
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur suppression orphelin:', error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const fixAllIssues = async () => {
    if (!analysis?.issues.length) return
    
    setFixingAll(true)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/fix-all`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      if (result.errors.length > 0) {
        toast.warning(`${result.fixed} correction(s), ${result.errors.length} erreur(s)`)
        console.warn('Erreurs de correction:', result.errors)
      } else {
        toast.success(`Toutes les corrections appliquées: ${result.fixed} réparation(s)`)
      }
      
      await analyzeSync()
      
    } catch (error) {
      console.error('Erreur corrections globales:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setFixingAll(false)
    }
  }

  const createTrigger = async () => {
    setCreatingTrigger(true)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/admin/auth-sync/create-trigger`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }

      toast.success('Trigger de synchronisation automatique créé avec succès!')
      
    } catch (error) {
      console.error('Erreur création trigger:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setCreatingTrigger(false)
    }
  }

  const stats = analysis ? {
    authCount: analysis.authUsersCount,
    dbCount: analysis.dbUsersCount,
    synchronized: analysis.synchronizedCount,
    issues: analysis.issues.length
  } : { authCount: 0, dbCount: 0, synchronized: 0, issues: 0 }

  // Afficher le diagnostic email si demandé
  if (showEmailDiagnostic) {
    return <EmailResendDiagnostic onClose={() => setShowEmailDiagnostic(false)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Gestionnaire de Synchronisation Auth</h1>
          <p className="text-muted-foreground">
            Diagnostique et corrige les problèmes de synchronisation entre Supabase Auth et la table users de manière sécurisée
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
          
          {analysis?.issues.length ? (
            <Button 
              onClick={fixAllIssues}
              disabled={fixingAll}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {fixingAll ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Correction...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Tout Corriger ({analysis.issues.length})
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Diagnostic Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Diagnostic des Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tester et diagnostiquer les problèmes d'envoi d'emails (vérification, réinitialisation de mot de passe).
          </p>
          
          <Button 
            onClick={() => setShowEmailDiagnostic(true)}
            variant="outline"
            className="border-secondary text-secondary-foreground hover:bg-secondary/20"
          >
            <Mail className="mr-2 h-4 w-4" />
            Ouvrir le Diagnostic Email
          </Button>
        </CardContent>
      </Card>

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
            <Zap className="h-5 w-5" />
            Synchronisation Automatique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Créer un trigger PostgreSQL pour synchroniser automatiquement tous les nouveaux utilisateurs entre Auth et la table users.
          </p>
          
          <Button 
            onClick={createTrigger}
            disabled={creatingTrigger}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/5"
          >
            {creatingTrigger ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Créer le Trigger de Sync Auto
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Liste des problèmes */}
      {analysis?.issues.length ? (
        <Card>
          <CardHeader>
            <h2>Problèmes Détectés ({analysis.issues.length})</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.issues.map((issue, index) => (
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
                      <span className="text-muted-foreground">
                        {issue.email}
                      </span>
                    </div>
                    <p>{issue.description}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {issue.type === 'missing_in_users' && (
                      <Button 
                        size="sm" 
                        onClick={() => fixMissingUser(issue.user_id, issue.email)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Créer en DB
                      </Button>
                    )}
                    
                    {issue.type === 'role_mismatch' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => fixRoleMismatch(issue.user_id, issue.email)}
                        className="border-primary text-primary hover:bg-primary/5"
                      >
                        Corriger Rôle
                      </Button>
                    )}
                    
                    {issue.type === 'orphaned_user' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => removeOrphanedUser(issue.user_id, issue.email)}
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
      ) : null}

      {analysis && analysis.issues.length === 0 && !analyzing && (
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