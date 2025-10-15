import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { supabase } from '../../utils/supabase/client'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface DiagnosticResult {
  title: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
}

export function AuthDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // 1. Vérifier la configuration Supabase
      diagnosticResults.push({
        title: 'Configuration Supabase',
        status: 'info',
        message: `Project ID: ${projectId}`,
        details: `URL: https://${projectId}.supabase.co`
      })

      // 2. Vérifier la connexion au serveur
      try {
        const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/health`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        if (healthResponse.ok) {
          diagnosticResults.push({
            title: 'Connexion serveur',
            status: 'success',
            message: 'Serveur accessible'
          })
        } else {
          diagnosticResults.push({
            title: 'Connexion serveur',
            status: 'error',
            message: `Erreur ${healthResponse.status}: ${healthResponse.statusText}`
          })
        }
      } catch (error) {
        diagnosticResults.push({
          title: 'Connexion serveur',
          status: 'error',
          message: 'Impossible de joindre le serveur',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }

      // 3. Vérifier la session actuelle
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          diagnosticResults.push({
            title: 'Session utilisateur',
            status: 'error',
            message: 'Erreur lors de la récupération de la session',
            details: sessionError.message
          })
        } else if (session) {
          diagnosticResults.push({
            title: 'Session utilisateur',
            status: 'success',
            message: `Session active pour ${session.user.email}`,
            details: `User ID: ${session.user.id}`
          })

          // 4. Tester l'accès au profil avec le token actuel
          try {
            const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            })

            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              diagnosticResults.push({
                title: 'Accès au profil',
                status: 'success',
                message: `Profil récupéré: ${profileData.profile.first_name} ${profileData.profile.last_name}`,
                details: `Rôle: ${profileData.profile.role}, Statut: ${profileData.status}`
              })
            } else {
              const errorText = await profileResponse.text()
              diagnosticResults.push({
                title: 'Accès au profil',
                status: 'error',
                message: `Erreur ${profileResponse.status}`,
                details: errorText
              })
            }
          } catch (error) {
            diagnosticResults.push({
              title: 'Accès au profil',
              status: 'error',
              message: 'Erreur lors de l\'accès au profil',
              details: error instanceof Error ? error.message : 'Erreur inconnue'
            })
          }
        } else {
          diagnosticResults.push({
            title: 'Session utilisateur',
            status: 'warning',
            message: 'Aucune session active'
          })
        }
      } catch (error) {
        diagnosticResults.push({
          title: 'Session utilisateur',
          status: 'error',
          message: 'Erreur lors de la vérification de la session',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }

      // 5. Tester la fonctionnalité de rafraîchissement de token
      if (session) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            diagnosticResults.push({
              title: 'Rafraîchissement token',
              status: 'error',
              message: 'Erreur lors du rafraîchissement du token',
              details: refreshError.message
            })
          } else if (refreshData.session) {
            diagnosticResults.push({
              title: 'Rafraîchissement token',
              status: 'success',
              message: 'Token rafraîchi avec succès',
              details: `Nouveau token généré, expiration: ${new Date(refreshData.session.expires_at! * 1000).toLocaleString()}`
            })
          }
        } catch (error) {
          diagnosticResults.push({
            title: 'Rafraîchissement token',
            status: 'error',
            message: 'Erreur lors du test de rafraîchissement',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
          })
        }
      }

      // 6. Vérifier l'état du localStorage/sessionStorage
      if (typeof window !== 'undefined') {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth') || key.startsWith('sb-')
        )
        
        if (authKeys.length > 0) {
          diagnosticResults.push({
            title: 'État du stockage local',
            status: 'info',
            message: `${authKeys.length} clé(s) d'authentification trouvée(s)`,
            details: authKeys.join(', ')
          })
        } else {
          diagnosticResults.push({
            title: 'État du stockage local',
            status: 'warning',
            message: 'Aucune clé d\'authentification dans le stockage local'
          })
        }
      }

      // 7. Tester le diagnostic d'authentification avancé depuis window.GasyWay
      if (typeof window !== 'undefined' && window.GasyWay?.auth?.diagnostic) {
        try {
          const advancedDiagnostic = await window.GasyWay.auth.diagnostic()
          
          if (advancedDiagnostic.session) {
            const session = advancedDiagnostic.session
            const remainingMinutes = session.expires_at ? 
              Math.floor((new Date(session.expires_at * 1000).getTime() - Date.now()) / (1000 * 60)) : 
              'N/A'
              
            diagnosticResults.push({
              title: 'Diagnostic avancé',
              status: 'success',
              message: `Session détaillée analysée`,
              details: `Token valide pendant: ${remainingMinutes} minutes\nAccess token: ${session.access_token?.length || 0} caractères\nRefresh token: ${session.refresh_token?.length || 0} caractères`
            })
          } else if (advancedDiagnostic.error) {
            diagnosticResults.push({
              title: 'Diagnostic avancé',
              status: 'error',
              message: 'Erreur dans le diagnostic avancé',
              details: advancedDiagnostic.error.message || 'Erreur inconnue'
            })
          }
        } catch (error) {
          diagnosticResults.push({
            title: 'Diagnostic avancé',
            status: 'warning',
            message: 'Impossible d\'exécuter le diagnostic avancé',
            details: error instanceof Error ? error.message : 'Fonction non disponible'
          })
        }
      }

      // 8. Vérifier l'initialisation de la base de données
      try {
        const initResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/init`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (initResponse.ok) {
          diagnosticResults.push({
            title: 'Initialisation DB',
            status: 'success',
            message: 'Base de données initialisée avec succès'
          })
        } else {
          const errorText = await initResponse.text()
          diagnosticResults.push({
            title: 'Initialisation DB',
            status: 'warning',
            message: `Erreur ${initResponse.status} lors de l'initialisation`,
            details: errorText
          })
        }
      } catch (error) {
        diagnosticResults.push({
          title: 'Initialisation DB',
          status: 'error',
          message: 'Erreur lors de l\'initialisation',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }

    } catch (error) {
      diagnosticResults.push({
        title: 'Diagnostic général',
        status: 'error',
        message: 'Erreur inattendue pendant le diagnostic',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    setResults(diagnosticResults)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Diagnostic d'authentification
          <Button onClick={runDiagnostic} disabled={loading} variant="outline" size="sm">
            {loading ? 'En cours...' : 'Relancer'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Diagnostic en cours...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.title}</h4>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                {result.details && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Détails</summary>
                    <pre className="mt-1 whitespace-pre-wrap">{result.details}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}