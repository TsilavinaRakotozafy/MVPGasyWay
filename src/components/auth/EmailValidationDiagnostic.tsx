import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Info,
  Settings
} from 'lucide-react'

export function EmailValidationDiagnostic() {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@gmail.com')
  const [results, setResults] = useState<{
    emailTest?: {
      success: boolean
      error?: string
      details?: any
    }
    configTest?: {
      success: boolean
      settings?: any
      error?: string
    }
  }>({})

  const testEmailValidation = async () => {
    setLoading(true)
    const newResults = { ...results }

    try {
      // Test 1: Essayer de créer un utilisateur avec cet email
      console.log('🧪 Test d\'inscription avec email:', testEmail)
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',  // Mot de passe temporaire
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })

      if (error) {
        newResults.emailTest = {
          success: false,
          error: error.message,
          details: {
            code: error.name,
            message: error.message,
            stack: error.stack
          }
        }
        
        // Si l'utilisateur existe déjà, ce n'est pas le problème d'email invalide
        if (error.message.includes('User already registered')) {
          newResults.emailTest.success = true
          newResults.emailTest.error = 'Email valide (utilisateur existe déjà)'
        }
      } else {
        newResults.emailTest = {
          success: true,
          details: {
            userId: data.user?.id,
            emailConfirmed: data.user?.email_confirmed_at,
            needsConfirmation: !data.user?.email_confirmed_at
          }
        }
        
        // Nettoyer en supprimant l'utilisateur de test si créé
        if (data.user) {
          try {
            // Note: En production, il faudrait un endpoint admin pour supprimer l'utilisateur
            console.log('👤 Utilisateur de test créé:', data.user.id)
          } catch (cleanupError) {
            console.warn('⚠️ Impossible de nettoyer l\'utilisateur de test:', cleanupError)
          }
        }
      }

    } catch (error: any) {
      newResults.emailTest = {
        success: false,
        error: error.message,
        details: error
      }
    }

    // Test 2: Vérifier les paramètres Supabase disponibles
    try {
      // Récupérer des informations sur la configuration (limitées côté client)
      const session = await supabase.auth.getSession()
      const user = await supabase.auth.getUser()
      
      newResults.configTest = {
        success: true,
        settings: {
          hasSession: !!session.data.session,
          currentUser: user.data.user?.email || 'Aucun',
          clientUrl: supabase.supabaseUrl,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      newResults.configTest = {
        success: false,
        error: error.message
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const getStatusBadge = (success?: boolean) => {
    if (success === undefined) return <Badge variant="secondary">Non testé</Badge>
    return success 
      ? <Badge variant="default" className="bg-green-100 text-green-800">✅ Succès</Badge>
      : <Badge variant="destructive">❌ Échec</Badge>
  }

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined) return <Info className="h-4 w-4 text-gray-400" />
    return success 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <CardTitle>Diagnostic Email Supabase</CardTitle>
          </div>
          <CardDescription>
            Diagnostiquer les problèmes d'emails "invalid" lors de l'inscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test email */}
          <div className="space-y-2">
            <Label htmlFor="test-email">Email à tester</Label>
            <div className="flex space-x-2">
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@exemple.com"
                type="email"
                className="flex-1"
              />
              <Button 
                onClick={testEmailValidation}
                disabled={loading || !testEmail}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Tester l'email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Emails prédéfinis */}
          <div className="flex flex-wrap gap-2">
            {['test@gmail.com', 'tsila@gmail.com', 'admin@test.fr', 'user@exemple.com'].map(email => (
              <Button
                key={email}
                variant="outline"
                size="sm"
                onClick={() => setTestEmail(email)}
                disabled={loading}
              >
                {email}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test email */}
            {results.emailTest && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.emailTest.success)}
                  <h3 className="font-medium">Test d'inscription email</h3>
                  {getStatusBadge(results.emailTest.success)}
                </div>
                
                {results.emailTest.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erreur:</strong> {results.emailTest.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {results.emailTest.details && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Détails techniques:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(results.emailTest.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Test configuration */}
            {results.configTest && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(results.configTest.success)}
                  <h3 className="font-medium">Configuration Supabase</h3>
                  {getStatusBadge(results.configTest.success)}
                </div>
                
                {results.configTest.settings && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Configuration actuelle:</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>URL Supabase:</strong> {results.configTest.settings.clientUrl}</p>
                      <p><strong>Session active:</strong> {results.configTest.settings.hasSession ? 'Oui' : 'Non'}</p>
                      <p><strong>Utilisateur connecté:</strong> {results.configTest.settings.currentUser}</p>
                      <p><strong>Timestamp:</strong> {results.configTest.settings.timestamp}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions de résolution */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-500" />
            <CardTitle>Solutions recommandées</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>1. Vérifier la configuration Supabase Auth :</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Allez sur votre <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Dashboard Supabase</a></li>
                  <li>• Authentication → Settings → Email</li>
                  <li>• Désactiver "Enable email confirmations" temporairement</li>
                  <li>• Vérifier que "Site URL" est configuré correctement</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>2. Erreurs courantes "Email invalid" :</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Confirmation d'email activée mais SMTP non configuré</li>
                  <li>• Restrictions de domaine (ex: seuls certains domaines autorisés)</li>
                  <li>• Projet Supabase en mode "Development" avec limitations</li>
                  <li>• Limite de quota email atteinte</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>3. Configuration recommandée pour le développement :</strong></p>
                <ul className="ml-4 space-y-1 text-sm text-green-800">
                  <li>• Enable email confirmations: <strong>OFF</strong></li>
                  <li>• Site URL: <strong>http://localhost:3000</strong></li>
                  <li>• Redirect URLs: <strong>http://localhost:3000/**</strong></li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}