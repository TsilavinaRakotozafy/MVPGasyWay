import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  TestTube,
  Trash2
} from 'lucide-react'

export function QuickSignupTest() {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test-' + Date.now() + '@exemple.com')
  const [testPassword, setTestPassword] = useState('test123456')
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    technicalDetails?: any
    userId?: string
  } | null>(null)

  const runSignupTest = async () => {
    setLoading(true)
    setLastResult(null)
    
    try {
      console.log('🧪 Test d\'inscription avec:', { email: testEmail, password: testPassword })
      
      // Étape 1: Créer l'utilisateur avec Supabase Auth uniquement
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })

      if (authError) {
        setLastResult({
          success: false,
          message: `❌ Erreur Supabase Auth: ${authError.message}`,
          technicalDetails: {
            errorName: authError.name,
            errorMessage: authError.message,
            errorCode: (authError as any).code
          }
        })
        return
      }

      if (!authData.user) {
        setLastResult({
          success: false,
          message: '❌ Aucun utilisateur créé par Supabase Auth',
          technicalDetails: { authData }
        })
        return
      }

      console.log('✅ Utilisateur créé dans auth.users:', authData.user.id)

      // Étape 2: Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (existingUser) {
        setLastResult({
          success: false,
          message: `🔥 UTILISATEUR DÉJÀ EXISTANT: ${authData.user.id}`,
          technicalDetails: {
            errorCode: 'USER_ALREADY_EXISTS',
            existingUserId: existingUser.id,
            newUserId: authData.user.id
          },
          userId: authData.user.id
        })
        return
      }

      // Étape 2b: Insérer dans notre table users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testEmail,
          role: 'voyageur',
          gdpr_consent: true,
          locale: 'fr',
          status: 'active'
          // created_at et updated_at ont des valeurs par défaut
        })

      if (userError) {
        setLastResult({
          success: false,
          message: `🔥 ERREUR TABLE USERS: ${userError.message}`,
          technicalDetails: {
            errorCode: userError.code,
            errorMessage: userError.message,
            errorDetails: userError.details,
            errorHint: userError.hint,
            createdUserId: authData.user.id
          },
          userId: authData.user.id
        })
        return
      }

      console.log('✅ Entrée créée dans table users')

      // Étape 3: Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          first_name: 'Test',
          last_name: 'User',
          phone: '+261123456789'
          // Pas besoin de role ici - c'est dans users
          // created_at et updated_at ont des valeurs par défaut
        })

      if (profileError) {
        setLastResult({
          success: false,
          message: `⚠️ Utilisateur créé mais erreur profil: ${profileError.message}`,
          technicalDetails: {
            profileError,
            createdUserId: authData.user.id
          },
          userId: authData.user.id
        })
        return
      }

      setLastResult({
        success: true,
        message: '✅ Test d\'inscription réussi !',
        technicalDetails: {
          userId: authData.user.id,
          email: testEmail
        },
        userId: authData.user.id
      })

    } catch (error: any) {
      console.error('❌ Erreur test inscription:', error)
      setLastResult({
        success: false,
        message: `❌ Erreur inattendue: ${error.message}`,
        technicalDetails: error
      })
    } finally {
      setLoading(false)
    }
  }

  const cleanupTestUser = async () => {
    if (!lastResult?.userId) return

    try {
      console.log('🧹 Nettoyage utilisateur test:', lastResult.userId)
      
      // Supprimer de nos tables personnalisées dans l'ordre inverse des dépendances
      const { error: interestsError } = await supabase.from('user_interests').delete().eq('profile_id', lastResult.userId)
      if (interestsError) console.warn('Warn cleanup user_interests:', interestsError)
      
      const { error: profilesError } = await supabase.from('profiles').delete().eq('user_id', lastResult.userId)
      if (profilesError) console.warn('Warn cleanup profiles:', profilesError)
      
      const { error: usersError } = await supabase.from('users').delete().eq('id', lastResult.userId)
      if (usersError) console.warn('Warn cleanup users:', usersError)
      
      // Note: On ne peut pas supprimer de auth.users depuis le client
      // Il faut le faire via l'interface admin Supabase
      
      toast.success('🧹 Données test nettoyées (auth.users reste à nettoyer manuellement)')
      setLastResult(null) // Reset le résultat après nettoyage
      
    } catch (error: any) {
      console.error('❌ Erreur nettoyage:', error)
      toast.error(`Erreur nettoyage: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-purple-500" />
            <CardTitle>Test d'inscription rapide</CardTitle>
          </div>
          <CardDescription>
            Tester directement l'inscription pour identifier l'erreur exacte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email de test</Label>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@exemple.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-password">Mot de passe</Label>
              <Input
                id="test-password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="mot de passe"
                type="password"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={runSignupTest}
              disabled={loading || !testEmail || !testPassword}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Tester l'inscription
                </>
              )}
            </Button>

            <Button
              onClick={() => setTestEmail('test-' + Date.now() + '@exemple.com')}
              variant="outline"
              disabled={loading}
            >
              Nouveau email
            </Button>

            {lastResult?.userId && (
              <Button
                onClick={cleanupTestUser}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {lastResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <CardTitle>Résultat du test</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={lastResult.success ? "default" : "destructive"}>
              <AlertDescription>
                {lastResult.message}
              </AlertDescription>
            </Alert>

            {lastResult.technicalDetails && (
              <div className="space-y-2">
                <h4 className="font-medium">Détails techniques :</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-64">
                  {JSON.stringify(lastResult.technicalDetails, null, 2)}
                </pre>
              </div>
            )}

            {!lastResult.success && lastResult.technicalDetails?.errorCode === '23502' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>🔥 ERREUR 23502 = Contrainte NOT NULL violée</strong></p>
                    <p>Cela confirme qu'une colonne obligatoire manque une valeur.</p>
                    <p>Si c'est "password_hash", cette colonne doit être supprimée de votre table users.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Ce test va :</strong></p>
            <ul className="ml-4 space-y-1">
              <li>1. Créer un utilisateur avec Supabase Auth</li>
              <li>2. Insérer les données dans votre table "users"</li>
              <li>3. Créer le profil associé</li>
              <li>4. Afficher l'erreur exacte si elle se produit</li>
            </ul>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Attention :</strong> Ce test crée de vrais comptes dans Supabase Auth. 
              Utilisez le bouton de nettoyage après le test.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}