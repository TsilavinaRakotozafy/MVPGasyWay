import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { TestTube, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface TestResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  timestamp: Date
}

export function UserCreationTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [testEmail, setTestEmail] = useState('test@example.com')

  async function runTest() {
    setTesting(true)
    setResults([])

    const newResults: TestResult[] = []

    // Étape 1: Test de connectivité serveur
    try {
      newResults.push({
        step: 'Connexion au serveur',
        status: 'pending',
        message: 'Test de connectivité...',
        timestamp: new Date()
      })
      setResults([...newResults])

      const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (healthResponse.ok) {
        newResults[newResults.length - 1] = {
          step: 'Connexion au serveur',
          status: 'success',
          message: 'Serveur accessible',
          timestamp: new Date()
        }
      } else {
        newResults[newResults.length - 1] = {
          step: 'Connexion au serveur',
          status: 'error',
          message: `Erreur HTTP ${healthResponse.status}`,
          timestamp: new Date()
        }
      }
      setResults([...newResults])
    } catch (error: any) {
      newResults[newResults.length - 1] = {
        step: 'Connexion au serveur',
        status: 'error',
        message: error.message,
        timestamp: new Date()
      }
      setResults([...newResults])
    }

    // Étape 2: Test de création d'utilisateur
    try {
      newResults.push({
        step: 'Création d\'utilisateur test',
        status: 'pending',
        message: 'Envoi de la requête de création...',
        timestamp: new Date()
      })
      setResults([...newResults])

      const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`, // Email unique
          password: 'testpass123',
          firstName: 'Test',
          lastName: 'User',
          role: 'traveler'
        })
      })

      const createResult = await createResponse.json()

      if (createResponse.ok) {
        newResults[newResults.length - 1] = {
          step: 'Création d\'utilisateur test',
          status: 'success',
          message: `Utilisateur créé: ${createResult.email}`,
          timestamp: new Date()
        }
      } else {
        newResults[newResults.length - 1] = {
          step: 'Création d\'utilisateur test',
          status: 'error',
          message: createResult.error || 'Erreur inconnue',
          timestamp: new Date()
        }
      }
      setResults([...newResults])
    } catch (error: any) {
      newResults[newResults.length - 1] = {
        step: 'Création d\'utilisateur test',
        status: 'error',
        message: error.message,
        timestamp: new Date()
      }
      setResults([...newResults])
    }

    // Étape 3: Test de configuration Supabase
    try {
      newResults.push({
        step: 'Configuration Supabase',
        status: 'pending',
        message: 'Vérification des variables d\'environnement...',
        timestamp: new Date()
      })
      setResults([...newResults])

      if (projectId && publicAnonKey) {
        newResults[newResults.length - 1] = {
          step: 'Configuration Supabase',
          status: 'success',
          message: 'Variables d\'environnement présentes',
          timestamp: new Date()
        }
      } else {
        newResults[newResults.length - 1] = {
          step: 'Configuration Supabase',
          status: 'error',
          message: 'Variables d\'environnement manquantes',
          timestamp: new Date()
        }
      }
      setResults([...newResults])
    } catch (error: any) {
      newResults[newResults.length - 1] = {
        step: 'Configuration Supabase',
        status: 'error',
        message: error.message,
        timestamp: new Date()
      }
      setResults([...newResults])
    }

    setTesting(false)

    // Afficher le résumé
    const successCount = newResults.filter(r => r.status === 'success').length
    const totalCount = newResults.length
    
    if (successCount === totalCount) {
      toast.success('Tous les tests sont passés avec succès!')
    } else {
      toast.error(`${totalCount - successCount} test(s) échoué(s)`)
    }
  }

  function getStatusIcon(status: TestResult['status']) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
    }
  }

  function getStatusColor(status: TestResult['status']) {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5" />
          <span>Test de création d'utilisateur</span>
        </CardTitle>
        <CardDescription>
          Testez la création d'utilisateur pour diagnostiquer les problèmes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="testEmail">Email de test (optionnel)</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <Button onClick={runTest} disabled={testing} className="mt-6">
            {testing ? 'Test en cours...' : 'Lancer le test'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Résultats du test :</h4>
            
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.step}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
                
                <Badge className={getStatusColor(result.status)}>
                  {result.status === 'pending' ? 'En cours' : result.status === 'success' ? 'Succès' : 'Échec'}
                </Badge>
              </div>
            ))}

            {/* Résumé */}
            {!testing && results.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">Résumé</h5>
                <p className="text-sm text-gray-600">
                  {results.filter(r => r.status === 'success').length} / {results.length} tests réussis
                </p>
                
                {results.some(r => r.status === 'error') && (
                  <div className="mt-3">
                    <Alert variant="destructive">
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Problèmes détectés :</strong></p>
                          <ul className="list-disc list-inside space-y-1">
                            {results.filter(r => r.status === 'error').map((result, index) => (
                              <li key={index}>{result.step}: {result.message}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Cliquez sur "Lancer le test" pour diagnostiquer les problèmes de création d'utilisateur
          </div>
        )}
      </CardContent>
    </Card>
  )
}