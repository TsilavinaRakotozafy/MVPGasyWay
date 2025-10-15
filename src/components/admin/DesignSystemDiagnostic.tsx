import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Monitor,
  Palette,
  Code
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { loadDesignTokens, applyDesignTokensToCSS } from '../../utils/design-system-loader'

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error'
  message: string
  details?: string
  data?: any
}

export function DesignSystemDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<{
    database: DiagnosticResult | null
    api: DiagnosticResult | null
    css: DiagnosticResult | null
    runtime: DiagnosticResult | null
  }>({
    database: null,
    api: null,
    css: null,
    runtime: null
  })
  
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    
    try {
      // Test 1: Base de données - Vérifier la table design_tokens
      const dbResult = await testDatabase()
      setDiagnostics(prev => ({ ...prev, database: dbResult }))

      // Test 2: API - Vérifier l'endpoint public
      const apiResult = await testAPI()
      setDiagnostics(prev => ({ ...prev, api: apiResult }))

      // Test 3: CSS - Vérifier les variables CSS
      const cssResult = await testCSS()
      setDiagnostics(prev => ({ ...prev, css: cssResult }))

      // Test 4: Runtime - Tester le chargement et l'application
      const runtimeResult = await testRuntime()
      setDiagnostics(prev => ({ ...prev, runtime: runtimeResult }))

      setLastCheck(new Date())
      
    } catch (error) {
      console.error('Erreur lors des diagnostics:', error)
      toast.error('Erreur lors des diagnostics')
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/design-tokens/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.tokens) {
          return {
            status: 'success',
            message: 'Table design_tokens accessible',
            details: `Design tokens trouvés en base`,
            data: result.tokens
          }
        } else {
          return {
            status: 'warning',
            message: 'Table accessible mais aucun token configuré',
            details: 'Créez un design token par défaut dans l\'éditeur'
          }
        }
      } else {
        return {
          status: 'error',
          message: 'Erreur d\'accès à la base de données',
          details: `Status: ${response.status}`
        }
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Connexion à la base échouée',
        details: error.message
      }
    }
  }

  const testAPI = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/health`)
      
      if (response.ok) {
        return {
          status: 'success',
          message: 'API serveur accessible',
          details: 'Endpoint design tokens fonctionnel'
        }
      } else {
        return {
          status: 'error',
          message: 'Serveur inaccessible',
          details: `Status: ${response.status}`
        }
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Connexion au serveur échouée',
        details: error.message
      }
    }
  }

  const testCSS = async (): Promise<DiagnosticResult> => {
    try {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      // Vérifier les variables CSS importantes
      const primary = computedStyle.getPropertyValue('--primary').trim()
      const fontSize = computedStyle.getPropertyValue('--font-size').trim()
      const fontFamily = computedStyle.getPropertyValue('--font-family').trim()
      
      if (primary && fontSize && fontFamily) {
        return {
          status: 'success',
          message: 'Variables CSS appliquées',
          details: `Primary: ${primary}, Font: ${fontFamily}, Size: ${fontSize}`,
          data: { primary, fontSize, fontFamily }
        }
      } else {
        return {
          status: 'warning',
          message: 'Variables CSS partiellement appliquées',
          details: `Manquant: ${!primary ? 'primary ' : ''}${!fontSize ? 'fontSize ' : ''}${!fontFamily ? 'fontFamily' : ''}`
        }
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Erreur lecture variables CSS',
        details: error.message
      }
    }
  }

  const testRuntime = async (): Promise<DiagnosticResult> => {
    try {
      const tokens = await loadDesignTokens()
      
      if (tokens) {
        // Tester l'application des tokens
        applyDesignTokensToCSS(tokens)
        
        return {
          status: 'success',
          message: 'Chargement et application réussis',
          details: `Tokens chargés: primary=${tokens.primary}, h1=${tokens.h1.fontSize}px`,
          data: tokens
        }
      } else {
        return {
          status: 'error',
          message: 'Échec du chargement des tokens',
          details: 'loadDesignTokens() a retourné null/undefined'
        }
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: 'Erreur runtime du design system',
        details: error.message
      }
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Diagnostic du Design System</h1>
          <p className="text-muted-foreground">
            Vérification de l'intégration des design tokens depuis Supabase
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastCheck && (
            <span className="text-sm text-muted-foreground">
              Dernière vérification: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Base de données */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="text-base">Base de données</CardTitle>
              {diagnostics.database && getStatusIcon(diagnostics.database.status)}
            </div>
            <CardDescription>
              Vérification de la table design_tokens dans Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostics.database ? (
              <div className="space-y-3">
                <Badge className={getStatusColor(diagnostics.database.status)}>
                  {diagnostics.database.message}
                </Badge>
                {diagnostics.database.details && (
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.database.details}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Test en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test API */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <CardTitle className="text-base">API Serveur</CardTitle>
              {diagnostics.api && getStatusIcon(diagnostics.api.status)}
            </div>
            <CardDescription>
              Vérification de l'endpoint design tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostics.api ? (
              <div className="space-y-3">
                <Badge className={getStatusColor(diagnostics.api.status)}>
                  {diagnostics.api.message}
                </Badge>
                {diagnostics.api.details && (
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.api.details}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Test en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test CSS */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle className="text-base">Variables CSS</CardTitle>
              {diagnostics.css && getStatusIcon(diagnostics.css.status)}
            </div>
            <CardDescription>
              Vérification de l'application des styles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostics.css ? (
              <div className="space-y-3">
                <Badge className={getStatusColor(diagnostics.css.status)}>
                  {diagnostics.css.message}
                </Badge>
                {diagnostics.css.details && (
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.css.details}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Test en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Runtime */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              <CardTitle className="text-base">Fonctionnement</CardTitle>
              {diagnostics.runtime && getStatusIcon(diagnostics.runtime.status)}
            </div>
            <CardDescription>
              Test complet de chargement et application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostics.runtime ? (
              <div className="space-y-3">
                <Badge className={getStatusColor(diagnostics.runtime.status)}>
                  {diagnostics.runtime.message}
                </Badge>
                {diagnostics.runtime.details && (
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.runtime.details}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Test en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(diagnostics).filter(d => d?.status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">Succès</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(diagnostics).filter(d => d?.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Avertissements</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(diagnostics).filter(d => d?.status === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">
                  {Object.values(diagnostics).filter(d => d === null).length}
                </div>
                <div className="text-sm text-muted-foreground">En cours</div>
              </div>
            </div>

            <Separator />

            {Object.values(diagnostics).every(d => d?.status === 'success') && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 <strong>Parfait !</strong> Le design system fonctionne correctement. 
                  Les design tokens sont chargés depuis Supabase et appliqués automatiquement.
                </AlertDescription>
              </Alert>
            )}

            {Object.values(diagnostics).some(d => d?.status === 'error') && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Problèmes détectés.</strong> Consultez les détails ci-dessus pour résoudre les erreurs.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}