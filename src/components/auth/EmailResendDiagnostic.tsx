import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { 
  Mail, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Settings, 
  User,
  Clock,
  AlertCircle 
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { getAuthCallbackUrl, getResetPasswordUrl } from '../../utils/figma-make-config'

interface EmailResendDiagnosticProps {
  onClose: () => void
}

export function EmailResendDiagnostic({ onClose }: EmailResendDiagnosticProps) {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [configCheck, setConfigCheck] = useState<any>(null)

  // Vérifier la configuration Supabase
  const checkSupabaseConfig = async () => {
    setLoading(true)
    const checks = []

    try {
      // 1. Tester la connectivité
      const { data: healthData, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      checks.push({
        name: 'Connectivité Supabase',
        status: healthError ? 'error' : 'success',
        message: healthError ? healthError.message : 'Connexion OK',
        details: healthError ? 'Vérifiez vos credentials Supabase' : 'Base de données accessible'
      })

      // 2. Vérifier la session utilisateur actuelle
      const { data: sessionData } = await supabase.auth.getSession()
      checks.push({
        name: 'Session utilisateur',
        status: sessionData.session ? 'success' : 'warning',
        message: sessionData.session ? 'Session active' : 'Aucune session active',
        details: sessionData.session ? `User: ${sessionData.session.user?.email}` : 'Non connecté'
      })

      // 3. Vérifier les URLs de configuration
      const authCallback = getAuthCallbackUrl()
      const resetPassword = getResetPasswordUrl()
      
      checks.push({
        name: 'URLs de redirection',
        status: 'info',
        message: 'URLs configurées',
        details: `Callback: ${authCallback}\nReset: ${resetPassword}`
      })

      setConfigCheck(checks)
    } catch (error: any) {
      console.error('Erreur check config:', error)
      checks.push({
        name: 'Erreur configuration',
        status: 'error',
        message: 'Erreur lors de la vérification',
        details: error.message
      })
      setConfigCheck(checks)
    } finally {
      setLoading(false)
    }
  }

  // Test de renvoi d'email de vérification
  const testSignupEmailResend = async () => {
    if (!testEmail) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    setLoading(true)
    const testResults = []

    try {
      console.log('🔄 Test renvoi email signup pour:', testEmail)

      // Test 1: Renvoi email signup
      const startTime = Date.now()
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: getAuthCallbackUrl()
        }
      })

      const duration = Date.now() - startTime

      testResults.push({
        test: 'Renvoi email signup',
        status: error ? 'error' : 'success',
        duration: `${duration}ms`,
        data: data,
        error: error?.message,
        details: error ? 
          `Erreur: ${error.message}` : 
          `Email de vérification renvoyé à ${testEmail}`,
        timestamp: new Date().toLocaleTimeString()
      })

      if (!error) {
        toast.success(`✅ Email de vérification renvoyé à ${testEmail}`)
      } else {
        toast.error(`❌ Erreur: ${error.message}`)
      }

    } catch (error: any) {
      console.error('Erreur test renvoi:', error)
      testResults.push({
        test: 'Renvoi email signup',
        status: 'error',
        duration: '-',
        error: error.message,
        details: `Erreur critique: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      })
    }

    setResults(prev => [...testResults, ...prev])
    setLoading(false)
  }

  // Test de renvoi d'email de réinitialisation
  const testResetPasswordEmail = async () => {
    if (!testEmail) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    setLoading(true)

    try {
      console.log('🔄 Test renvoi email reset password pour:', testEmail)

      const startTime = Date.now()
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: getResetPasswordUrl()
      })

      const duration = Date.now() - startTime

      const testResult = {
        test: 'Email réinitialisation',
        status: error ? 'error' : 'success',
        duration: `${duration}ms`,
        error: error?.message,
        details: error ? 
          `Erreur: ${error.message}` : 
          `Email de réinitialisation envoyé à ${testEmail}`,
        timestamp: new Date().toLocaleTimeString()
      }

      setResults(prev => [testResult, ...prev])

      if (!error) {
        toast.success(`✅ Email de réinitialisation envoyé à ${testEmail}`)
      } else {
        toast.error(`❌ Erreur: ${error.message}`)
      }

    } catch (error: any) {
      console.error('Erreur test reset:', error)
      setResults(prev => [{
        test: 'Email réinitialisation',
        status: 'error',
        duration: '-',
        error: error.message,
        details: `Erreur critique: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  // Test de création d'un compte de test
  const testAccountCreation = async () => {
    if (!testEmail) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    setLoading(true)

    try {
      console.log('🔄 Test création compte pour:', testEmail)

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })

      const testResult = {
        test: 'Création compte test',
        status: error ? 'error' : 'success',
        duration: '-',
        error: error?.message,
        details: error ? 
          `Erreur: ${error.message}` : 
          `Compte créé. Session: ${data.session ? 'Oui' : 'Non (email requis)'}`,
        timestamp: new Date().toLocaleTimeString(),
        data: data
      }

      setResults(prev => [testResult, ...prev])

      if (!error) {
        if (data.session) {
          toast.success('✅ Compte créé et connecté automatiquement')
        } else {
          toast.success('✅ Compte créé, vérification email requise')
        }
      } else {
        toast.error(`❌ Erreur création: ${error.message}`)
      }

    } catch (error: any) {
      console.error('Erreur test création:', error)
      setResults(prev => [{
        test: 'Création compte test',
        status: 'error',
        duration: '-',
        error: error.message,
        details: `Erreur critique: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error': return <X className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Diagnostic Email - GasyWay
              </CardTitle>
              <CardDescription>
                Outil de diagnostic pour tester et déboguer l'envoi d'emails
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </CardHeader>
        </Card>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="test">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tests d'envoi
            </TabsTrigger>
            <TabsTrigger value="results">
              <Clock className="h-4 w-4 mr-2" />
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vérification de la configuration</CardTitle>
                <CardDescription>
                  Diagnostic de la configuration Supabase et des URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={checkSupabaseConfig}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Vérifier la configuration
                </Button>

                {configCheck && (
                  <div className="space-y-3">
                    {configCheck.map((check: any, index: number) => (
                      <Alert key={index} className={check.status === 'error' ? 'border-red-200' : ''}>
                        <div className="flex items-start gap-2">
                          {getStatusIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{check.name}</h4>
                              <Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {check.message}
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                              {check.details}
                            </pre>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tests d'envoi d'emails</CardTitle>
                <CardDescription>
                  Testez l'envoi d'emails de vérification et de réinitialisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email de test</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="bg-input-background"
                  />
                  <p className="text-sm text-muted-foreground">
                    Utilisez une adresse email que vous contrôlez pour recevoir les emails de test
                  </p>
                </div>

                <div className="grid gap-3">
                  <Button 
                    onClick={testSignupEmailResend}
                    disabled={loading || !testEmail}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Tester renvoi email de vérification
                  </Button>

                  <Button 
                    onClick={testResetPasswordEmail}
                    disabled={loading || !testEmail}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Tester email réinitialisation
                  </Button>

                  <Button 
                    onClick={testAccountCreation}
                    disabled={loading || !testEmail}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    Tester création de compte
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important :</strong> Ces tests envoient de vrais emails. 
                    Utilisez une adresse email que vous contrôlez et vérifiez votre dossier spam.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des tests</CardTitle>
                <CardDescription>
                  Résultats des tests d'envoi d'emails avec détails techniques
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun test effectué</p>
                    <p className="text-sm">Utilisez l'onglet "Tests d'envoi" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <Alert key={index} className={result.status === 'error' ? 'border-red-200' : ''}>
                        <div className="flex items-start gap-2">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{result.test}</h4>
                              <Badge className={getStatusColor(result.status)}>
                                {result.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {result.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.details}
                            </p>
                            {result.duration && (
                              <p className="text-xs text-muted-foreground">
                                Durée: {result.duration}
                              </p>
                            )}
                            {result.error && (
                              <Alert className="mt-2 bg-red-50 border-red-200">
                                <AlertDescription className="text-sm">
                                  <strong>Erreur :</strong> {result.error}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}