import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export function SignupDiagnostic() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])
    
    const diagnostics: DiagnosticResult[] = []

    try {
      // 1. Test de connexion Supabase
      console.log('🔄 Test connexion Supabase...')
      try {
        const { data, error } = await supabase.from('users').select('id').limit(1)
        if (error) throw error
        diagnostics.push({
          name: 'Connexion Supabase',
          status: 'success',
          message: 'Connexion OK'
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Connexion Supabase',
          status: 'error',
          message: `Erreur: ${error.message}`
        })
      }

      // 2. Vérification table users
      console.log('🔄 Test table users...')
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, status')
          .limit(1)
        
        if (error) throw error
        
        diagnostics.push({
          name: 'Table users',
          status: 'success',
          message: `Accessible (${data?.length || 0} entrées échantillon)`
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Table users',
          status: 'error',
          message: `Erreur: ${error.message}`,
          details: error
        })
      }

      // 3. Vérification table profiles
      console.log('🔄 Test table profiles...')
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, role')
          .limit(1)
        
        if (error) throw error
        
        diagnostics.push({
          name: 'Table profiles',
          status: 'success',
          message: `Accessible (${data?.length || 0} entrées échantillon)`
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Table profiles',
          status: 'error',
          message: `Erreur: ${error.message}`,
          details: error
        })
      }

      // 4. Test insertion factice dans users
      console.log('🔄 Test insertion users...')
      try {
        const testUserId = 'test-user-' + Date.now()
        const { error } = await supabase
          .from('users')
          .insert({
            id: testUserId,
            email: 'test@example.com',
            gdpr_consent: true,
            locale: 'fr',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          })

        if (error) throw error

        // Nettoyer immédiatement
        await supabase.from('users').delete().eq('id', testUserId)

        diagnostics.push({
          name: 'Insertion users',
          status: 'success',
          message: 'Insertion/suppression test OK'
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Insertion users',
          status: 'error',
          message: `Erreur: ${error.message}`,
          details: error
        })
      }

      // 5. Test insertion factice dans profiles
      console.log('🔄 Test insertion profiles...')
      try {
        const testUserId = 'test-profile-' + Date.now()
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: testUserId,
            first_name: 'Test',
            last_name: 'User',
            phone: '+261340000000',
            role: 'voyageur',
            first_login_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        // Nettoyer immédiatement
        await supabase.from('profiles').delete().eq('user_id', testUserId)

        diagnostics.push({
          name: 'Insertion profiles',
          status: 'success',
          message: 'Insertion/suppression test OK'
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Insertion profiles',
          status: 'error',
          message: `Erreur: ${error.message}`,
          details: error
        })
      }

      // 6. Test Supabase Auth
      console.log('🔄 Test Supabase Auth status...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        diagnostics.push({
          name: 'Supabase Auth',
          status: session ? 'success' : 'warning',
          message: session ? 'Session active trouvée' : 'Aucune session active (normal)'
        })
      } catch (error: any) {
        diagnostics.push({
          name: 'Supabase Auth',
          status: 'error',
          message: `Erreur: ${error.message}`
        })
      }

    } catch (globalError: any) {
      console.error('❌ Erreur diagnostic globale:', globalError)
      diagnostics.push({
        name: 'Diagnostic global',
        status: 'error',
        message: `Erreur globale: ${globalError.message}`
      })
    }

    setResults(diagnostics)
    setLoading(false)

    // Résumé dans la console
    console.log('📊 Résumé diagnostic inscription:')
    diagnostics.forEach(d => {
      const emoji = d.status === 'success' ? '✅' : d.status === 'error' ? '❌' : '⚠️'
      console.log(`${emoji} ${d.name}: ${d.message}`)
    })
  }

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✅ OK</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">❌ Erreur</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Warning</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <CardTitle>Diagnostic Inscription</CardTitle>
        </div>
        <CardDescription>
          Vérifiez la configuration des tables et permissions pour l'inscription
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Lancer le diagnostic
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Résultats:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Détails technique</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Si "Table users" ou "Table profiles" échoue : vérifiez que les tables existent dans Supabase</li>
                  <li>Si "Insertion" échoue : vérifiez les politiques RLS (Row Level Security)</li>
                  <li>Si tout fonctionne mais l'inscription échoue : vérifiez la configuration Auth (confirmation email)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}