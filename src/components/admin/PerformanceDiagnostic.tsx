import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { CheckCircle, XCircle, Clock, Zap, Database, Users, Shield } from 'lucide-react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface PerformanceTest {
  name: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'running' | 'success' | 'error'
  duration?: number
  error?: string
  details?: string
}

export function PerformanceDiagnostic() {
  const [tests, setTests] = useState<PerformanceTest[]>([
    {
      name: 'Connexion Supabase',
      description: 'Test de la latence de connexion au serveur Supabase',
      icon: <Database className="h-4 w-4" />,
      status: 'pending'
    },
    {
      name: 'API Server',
      description: 'Test de réponse du serveur Edge Function',
      icon: <Zap className="h-4 w-4" />,
      status: 'pending'
    },
    {
      name: 'Authentification',
      description: 'Test de la vitesse d\'authentification',
      icon: <Shield className="h-4 w-4" />,
      status: 'pending'
    },
    {
      name: 'Utilisateurs de démo',
      description: 'Vérification de la disponibilité des comptes de test',
      icon: <Users className="h-4 w-4" />,
      status: 'pending'
    },
    {
      name: 'Cache localStorage',
      description: 'Test de la performance du cache local',
      icon: <Clock className="h-4 w-4" />,
      status: 'pending'
    }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [summary, setSummary] = useState<{
    total: number
    success: number
    errors: number
    avgTime: number
  } | null>(null)

  async function runPerformanceTests() {
    setIsRunning(true)
    setSummary(null)
    
    // Reset all tests
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending' as const,
      duration: undefined,
      error: undefined,
      details: undefined
    })))

    const results: PerformanceTest[] = []

    // Test 1: Connexion Supabase
    await runTest('Connexion Supabase', async () => {
      const start = performance.now()
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        const duration = performance.now() - start
        
        if (response.ok) {
          return {
            success: true,
            duration,
            details: `Latence: ${Math.round(duration)}ms`
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        return {
          success: false,
          duration: performance.now() - start,
          error: error instanceof Error ? error.message : 'Erreur de connexion'
        }
      }
    })

    // Test 2: API Server
    await runTest('API Server', async () => {
      const start = performance.now()
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        const duration = performance.now() - start
        
        if (response.ok) {
          return {
            success: true,
            duration,
            details: `Réponse: ${Math.round(duration)}ms`
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        return {
          success: false,
          duration: performance.now() - start,
          error: error instanceof Error ? error.message : 'Serveur non accessible'
        }
      }
    })

    // Test 3: Authentification
    await runTest('Authentification', async () => {
      const start = performance.now()
      
      try {
        const { supabase } = await import('../../utils/supabase/client')
        const { data, error } = await supabase.auth.getSession()
        
        const duration = performance.now() - start
        
        if (error) {
          throw new Error(error.message)
        }
        
        return {
          success: true,
          duration,
          details: `Session: ${data.session ? 'Active' : 'Aucune'} (${Math.round(duration)}ms)`
        }
      } catch (error) {
        return {
          success: false,
          duration: performance.now() - start,
          error: error instanceof Error ? error.message : 'Erreur d\'authentification'
        }
      }
    })

    // Test 4: Utilisateurs de démo
    await runTest('Utilisateurs de démo', async () => {
      const start = performance.now()
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/auth/demo-status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        
        const duration = performance.now() - start
        
        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            duration,
            details: `Comptes disponibles: ${data.available ? 'Oui' : 'Non'} (${Math.round(duration)}ms)`
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        return {
          success: false,
          duration: performance.now() - start,
          error: error instanceof Error ? error.message : 'Test des utilisateurs échoué'
        }
      }
    })

    // Test 5: Cache localStorage
    await runTest('Cache localStorage', async () => {
      const start = performance.now()
      
      try {
        // Test d'écriture
        const testData = { timestamp: Date.now(), test: 'performance' }
        localStorage.setItem('performance_test', JSON.stringify(testData))
        
        // Test de lecture
        const retrieved = JSON.parse(localStorage.getItem('performance_test') || '{}')
        
        // Nettoyage
        localStorage.removeItem('performance_test')
        
        const duration = performance.now() - start
        
        if (retrieved.test === 'performance') {
          return {
            success: true,
            duration,
            details: `Cache opérationnel (${Math.round(duration)}ms)`
          }
        } else {
          throw new Error('Test de lecture/écriture échoué')
        }
      } catch (error) {
        return {
          success: false,
          duration: performance.now() - start,
          error: error instanceof Error ? error.message : 'Cache non fonctionnel'
        }
      }
    })

    // Calculer le résumé
    const successCount = results.filter(test => test.status === 'success').length
    const errorCount = results.filter(test => test.status === 'error').length
    const avgTime = results.reduce((sum, test) => sum + (test.duration || 0), 0) / results.length

    setSummary({
      total: results.length,
      success: successCount,
      errors: errorCount,
      avgTime
    })

    setIsRunning(false)
  }

  async function runTest(testName: string, testFn: () => Promise<{ success: boolean; duration: number; error?: string; details?: string }>) {
    // Marquer le test comme en cours
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status: 'running' as const }
        : test
    ))

    const result = await testFn()

    // Mettre à jour le résultat
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? {
            ...test,
            status: result.success ? 'success' as const : 'error' as const,
            duration: result.duration,
            error: result.error,
            details: result.details
          }
        : test
    ))
  }

  function getStatusIcon(status: PerformanceTest['status']) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  function getStatusBadge(status: PerformanceTest['status'], duration?: number) {
    switch (status) {
      case 'success':
        const timeColor = duration && duration > 2000 ? 'destructive' : 
                         duration && duration > 1000 ? 'secondary' : 'default'
        return <Badge variant={timeColor}>{duration ? `${Math.round(duration)}ms` : 'OK'}</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'running':
        return <Badge variant="secondary">En cours...</Badge>
      default:
        return <Badge variant="outline">En attente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Diagnostic des performances</h1>
          <p className="text-gray-600">Analyser les temps de réponse et identifier les goulots d'étranglement</p>
        </div>
        
        <Button 
          onClick={runPerformanceTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? 'Test en cours...' : 'Lancer le diagnostic'}
        </Button>
      </div>

      {summary && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Diagnostic terminé: {summary.success}/{summary.total} tests réussis
            {summary.errors > 0 && ` (${summary.errors} erreurs)`}
            {' '}• Temps moyen: {Math.round(summary.avgTime)}ms
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {test.icon}
                  <div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.status)}
                      <h3 className="font-medium">{test.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    {test.details && (
                      <p className="text-xs text-green-600 mt-1">{test.details}</p>
                    )}
                    {test.error && (
                      <p className="text-xs text-red-600 mt-1">Erreur: {test.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {getStatusBadge(test.status, test.duration)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Conseils d'optimisation</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les temps de réponse supérieurs à 2s peuvent indiquer un problème de réseau</li>
          <li>• Vérifiez la console du navigateur pour les erreurs détaillées</li>
          <li>• Les utilisateurs de démo sont créés automatiquement au premier lancement</li>
          <li>• Le cache localStorage améliore les performances lors des rechargements</li>
        </ul>
      </div>
    </div>
  )
}