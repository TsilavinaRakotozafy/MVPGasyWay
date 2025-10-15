import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Users,
  Settings,
  Shield
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { UserCreationTest } from './UserCreationTest'

interface TableInfo {
  name: string
  exists: boolean
  rowCount?: number
  error?: string
}

interface DiagnosticResults {
  tables: TableInfo[]
  authStatus: 'connected' | 'error' | 'checking'
  storageStatus: 'available' | 'error' | 'checking'
  lastCheck: Date
}

export function DatabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    runDiagnostic()
  }, [])

  async function runDiagnostic() {
    setLoading(true)
    
    const diagnosticResults: DiagnosticResults = {
      tables: [],
      authStatus: 'checking',
      storageStatus: 'checking',
      lastCheck: new Date()
    }

    try {
      // Vérification des tables principales
      const tablesToCheck = [
        'users',
        'profiles', 
        'packs',
        'bookings',
        'favorites',
        'reviews',
        'payments',
        'partners',
        'regions',
        'interests'
      ]

      for (const tableName of tablesToCheck) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (error) {
            diagnosticResults.tables.push({
              name: tableName,
              exists: false,
              error: error.message
            })
          } else {
            diagnosticResults.tables.push({
              name: tableName,
              exists: true,
              rowCount: count || 0
            })
          }
        } catch (err: any) {
          diagnosticResults.tables.push({
            name: tableName,
            exists: false,
            error: err.message
          })
        }
      }

      // Vérification de l'authentification
      try {
        const { data: { session } } = await supabase.auth.getSession()
        diagnosticResults.authStatus = session ? 'connected' : 'error'
      } catch {
        diagnosticResults.authStatus = 'error'
      }

      // Vérification du storage
      try {
        const { data } = await supabase.storage.listBuckets()
        diagnosticResults.storageStatus = data ? 'available' : 'error'
      } catch {
        diagnosticResults.storageStatus = 'error'
      }

      setResults(diagnosticResults)
      
    } catch (error) {
      console.error('Erreur diagnostic:', error)
      toast.error('Erreur lors du diagnostic')
    } finally {
      setLoading(false)
    }
  }

  function getTableStatusIcon(table: TableInfo) {
    if (table.exists) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'connected':
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'checking':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'connected': return 'Connecté'
      case 'available': return 'Disponible'
      case 'error': return 'Erreur'
      case 'checking': return 'Vérification...'
      default: return status
    }
  }

  const criticalTables = ['users', 'profiles']
  const missingCriticalTables = results?.tables.filter(t => 
    criticalTables.includes(t.name) && !t.exists
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl">Diagnostic de la base de données</h2>
          <p className="text-gray-600">Vérification de l'état des tables et services</p>
        </div>
        
        <Button onClick={runDiagnostic} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Diagnostic...' : 'Actualiser'}
        </Button>
      </div>

      {missingCriticalTables.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Tables critiques manquantes :</strong></p>
              <ul className="list-disc list-inside space-y-1">
                {missingCriticalTables.map(table => (
                  <li key={table.name}>
                    <code>{table.name}</code> - {table.error}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Ces tables sont nécessaires pour le fonctionnement de l'application. 
                Veuillez vérifier votre configuration Supabase.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status des services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Authentification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(results?.authStatus || 'checking')}>
              {getStatusLabel(results?.authStatus || 'checking')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(results?.storageStatus || 'checking')}>
              {getStatusLabel(results?.storageStatus || 'checking')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Tables</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-1">
                <p className="text-sm">
                  {results.tables.filter(t => t.exists).length} / {results.tables.length} tables
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{
                      width: `${(results.tables.filter(t => t.exists).length / results.tables.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">Vérification...</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détail des tables */}
      <Card>
        <CardHeader>
          <CardTitle>État des tables de données</CardTitle>
          <CardDescription>
            Vérification de l'existence et du contenu des tables principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="space-y-3">
              {results.tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTableStatusIcon(table)}
                    <div>
                      <p className="font-medium">{table.name}</p>
                      {table.error && (
                        <p className="text-sm text-red-600">{table.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {table.exists ? (
                      <Badge variant="outline">
                        {table.rowCount} ligne{table.rowCount !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Manquante</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-sm text-gray-500 mt-4">
                Dernière vérification : {results.lastCheck.toLocaleString('fr-FR')}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions pour résoudre les problèmes */}
      {missingCriticalTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Actions recommandées</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Configuration Supabase</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Connectez-vous à votre dashboard Supabase</li>
                  <li>Accédez à l'éditeur SQL</li>
                  <li>Créez les tables manquantes avec les bonnes structures</li>
                  <li>Configurez les politiques RLS (Row Level Security)</li>
                  <li>Actualisez ce diagnostic</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Tables critiques requises</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li><code>users</code> - Informations de base des utilisateurs</li>
                  <li><code>profiles</code> - Profils étendus des utilisateurs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test de création d'utilisateur */}
      <UserCreationTest />
    </div>
  )
}