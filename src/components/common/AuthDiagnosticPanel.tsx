import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  User,
  Key,
  Database,
  Wifi
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase, validateToken } from '../../utils/supabase/client'
import { api, handleApiError } from '../../utils/api'
import { toast } from 'sonner@2.0.3'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string
}

export function AuthDiagnosticPanel() {
  const { user, session, loading, refreshUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [running, setRunning] = useState(false)

  const runDiagnostics = async () => {
    setRunning(true)
    setDiagnostics([])
    
    const results: DiagnosticResult[] = []

    // 1. Test de la session Supabase
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        results.push({
          name: 'Session Supabase',
          status: 'error',
          message: 'Erreur récupération session',
          details: error.message
        })
      } else if (session) {
        results.push({
          name: 'Session Supabase',
          status: 'success',
          message: `Session active pour ${session.user.email}`,
          details: `Expire le ${new Date(session.expires_at! * 1000).toLocaleString()}`
        })
      } else {
        results.push({
          name: 'Session Supabase',
          status: 'warning',
          message: 'Aucune session active',
          details: 'Utilisateur non connecté'
        })
      }
    } catch (error) {
      results.push({
        name: 'Session Supabase',
        status: 'error',
        message: 'Erreur critique session',
        details: String(error)
      })
    }

    // 2. Test de validation du token
    if (session?.access_token) {
      const isValid = validateToken(session.access_token)
      results.push({
        name: 'Validation Token',
        status: isValid ? 'success' : 'error',
        message: isValid ? 'Token valide' : 'Token invalide ou malformé',
        details: `Longueur: ${session.access_token.length} caractères`
      })
    }

    // 3. Test de l'utilisateur dans le contexte
    results.push({
      name: 'Contexte Utilisateur',
      status: user ? 'success' : 'warning',
      message: user ? `Utilisateur: ${user.email} (${user.role})` : 'Aucun utilisateur',
      details: user ? `Statut: ${user.status}, Première connexion: ${user.first_login_completed}` : undefined
    })

    // 4. Test de l'API Health Check
    try {
      const healthData = await api.get('/health')
      results.push({
        name: 'API Server',
        status: 'success',
        message: 'Serveur accessible',
        details: `Version: ${healthData.version}, Timestamp: ${new Date(healthData.timestamp).toLocaleString()}`
      })
    } catch (error) {
      results.push({
        name: 'API Server',
        status: 'error',
        message: 'Serveur inaccessible',
        details: handleApiError(error)
      })
    }

    // 5. Test d'un appel API authentifié si connecté
    if (user) {
      try {
        const profileData = await api.authGet('/auth/profile')
        results.push({
          name: 'API Authentifiée',
          status: 'success',
          message: 'Profil récupéré avec succès',
          details: `Rôle: ${profileData.profile.role}`
        })
      } catch (error) {
        results.push({
          name: 'API Authentifiée',
          status: 'error',
          message: 'Erreur appel authentifié',
          details: handleApiError(error)
        })
      }
    }

    // 6. Test de la base de données (via les centres d'intérêt publics)
    try {
      const interests = await api.get('/interests')
      results.push({
        name: 'Base de Données',
        status: 'success',
        message: `${interests?.length || 0} centres d'intérêt trouvés`,
        details: 'Connexion base de données OK'
      })
    } catch (error) {
      results.push({
        name: 'Base de Données',
        status: 'error',
        message: 'Erreur base de données',
        details: handleApiError(error)
      })
    }

    setDiagnostics(results)
    setRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
    }
  }

  const handleForceRefresh = async () => {
    try {
      toast.info('Actualisation de l\'authentification...')
      await refreshUser()
      await runDiagnostics()
      toast.success('Authentification actualisée')
    } catch (error) {
      console.error('Erreur actualisation:', error)
      toast.error('Erreur lors de l\'actualisation')
    }
  }

  useEffect(() => {
    if (isOpen && diagnostics.length === 0) {
      runDiagnostics()
    }
  }, [isOpen])

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Diagnostic Authentification</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                {user && <CheckCircle className="h-4 w-4 text-green-600" />}
                {!user && !loading && <XCircle className="h-4 w-4 text-red-600" />}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* État actuel */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">État actuel</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleForceRefresh}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Actualiser
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runDiagnostics}
                      disabled={running}
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Diagnostiquer
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {loading ? 'Chargement...' : user ? `Connecté: ${user.email}` : 'Non connecté'}
                </div>
              </div>

              {/* Résultats des diagnostics */}
              {diagnostics.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Résultats des tests</div>
                  {diagnostics.map((diagnostic, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 border rounded">
                      {getStatusIcon(diagnostic.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{diagnostic.name}</span>
                          {getStatusBadge(diagnostic.status)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{diagnostic.message}</div>
                        {diagnostic.details && (
                          <div className="text-xs text-gray-500 mt-1 break-words">
                            {diagnostic.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions rapides */}
              <div className="border-t pt-3">
                <div className="text-xs text-gray-500">
                  Utilisez ce panel pour diagnostiquer les problèmes d'authentification et d'API.
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}