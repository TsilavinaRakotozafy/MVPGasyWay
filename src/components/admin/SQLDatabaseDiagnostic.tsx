import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Heart,
  Link,
  Loader2,
  Play,
  RotateCcw
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { initializeSQLDatabase, resetSQLDatabase } from '../../utils/initSQLDatabase'

interface TableStats {
  name: string
  count: number
  accessible: boolean
  error?: string
}

interface DiagnosticData {
  tables: TableStats[]
  totalUsers: number
  totalProfiles: number
  totalInterests: number
  totalUserInterests: number
  lastCheck: string
}

export function SQLDatabaseDiagnostic() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadDiagnosticData()
  }, [])

  const loadDiagnosticData = async () => {
    setLoading(true)
    try {
      const tables = ['users', 'profiles', 'interests', 'user_interests']
      const tableStats: TableStats[] = []
      let totalUsers = 0
      let totalProfiles = 0
      let totalInterests = 0
      let totalUserInterests = 0

      // Tester chaque table
      for (const tableName of tables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (error) {
            tableStats.push({
              name: tableName,
              count: 0,
              accessible: false,
              error: error.message
            })
          } else {
            const tableCount = count || 0
            tableStats.push({
              name: tableName,
              count: tableCount,
              accessible: true
            })

            // Stocker les totaux
            switch (tableName) {
              case 'users': totalUsers = tableCount; break
              case 'profiles': totalProfiles = tableCount; break
              case 'interests': totalInterests = tableCount; break
              case 'user_interests': totalUserInterests = tableCount; break
            }
          }
        } catch (error: any) {
          tableStats.push({
            name: tableName,
            count: 0,
            accessible: false,
            error: error.message
          })
        }
      }

      setData({
        tables: tableStats,
        totalUsers,
        totalProfiles,
        totalInterests,
        totalUserInterests,
        lastCheck: new Date().toLocaleString('fr-FR')
      })

    } catch (error: any) {
      console.error('Erreur diagnostic:', error)
      toast.error('Erreur lors du diagnostic')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setActionLoading('init')
    try {
      const result = await initializeSQLDatabase()
      
      if (result.success) {
        toast.success(result.message)
        await loadDiagnosticData()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error('Erreur lors de l\'initialisation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action supprimera TOUTES les données de la base ! Continuer ?')) {
      return
    }

    setActionLoading('reset')
    try {
      const result = await resetSQLDatabase()
      
      if (result.success) {
        toast.success(result.message)
        await loadDiagnosticData()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setActionLoading(null)
    }
  }

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'users': return <Users className="h-4 w-4" />
      case 'profiles': return <Users className="h-4 w-4" />
      case 'interests': return <Heart className="h-4 w-4" />
      case 'user_interests': return <Link className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getTableDescription = (tableName: string) => {
    switch (tableName) {
      case 'users': return 'Comptes utilisateur et authentification'
      case 'profiles': return 'Profils et informations personnelles'
      case 'interests': return 'Catalogue des centres d\'intérêt'
      case 'user_interests': return 'Associations utilisateur-intérêts'
      default: return 'Table de données'
    }
  }

  const allTablesAccessible = data?.tables.every(t => t.accessible) ?? false
  const hasData = data && (data.totalUsers > 0 || data.totalInterests > 0)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span>Diagnostic Base SQL</span>
          </h1>
          <p className="text-gray-600">État des tables Supabase et données relationnelles</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={loadDiagnosticData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleInitialize}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'init' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Initialiser
          </Button>
        </div>
      </div>

      {/* État global */}
      <Alert className={allTablesAccessible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <div className="flex items-center space-x-2">
          {allTablesAccessible ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={allTablesAccessible ? 'text-green-800' : 'text-red-800'}>
            {allTablesAccessible 
              ? 'Toutes les tables sont accessibles et fonctionnelles'
              : 'Certaines tables ne sont pas accessibles. Vérifiez la configuration Supabase.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Instructions si tables non accessibles */}
      {!allTablesAccessible && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action requise :</strong> Les tables SQL doivent être créées manuellement dans l'interface Supabase. 
            Consultez le fichier <code>/sql/create_tables.sql</code> pour les scripts de création.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques générales */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{data.totalUsers}</div>
              <p className="text-sm text-gray-600">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{data.totalProfiles}</div>
              <p className="text-sm text-gray-600">Profils</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{data.totalInterests}</div>
              <p className="text-sm text-gray-600">Intérêts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{data.totalUserInterests}</div>
              <p className="text-sm text-gray-600">Associations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* État des tables */}
      <Card>
        <CardHeader>
          <CardTitle>État des Tables</CardTitle>
          <CardDescription>
            Vérification de l'accessibilité et du contenu de chaque table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Vérification des tables...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTableIcon(table.name)}
                    <div>
                      <h4 className="font-medium">{table.name}</h4>
                      <p className="text-sm text-gray-600">{getTableDescription(table.name)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{table.count}</div>
                      <div className="text-xs text-gray-500">enregistrements</div>
                    </div>
                    
                    {table.accessible ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accessible
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Erreur
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de diagnostic */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Informations Système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Dernière vérification :</strong><br />
                {data.lastCheck}
              </div>
              <div>
                <strong>Architecture :</strong><br />
                Tables SQL relationnelles
              </div>
              <div>
                <strong>Authentification :</strong><br />
                Supabase Auth + tables users
              </div>
              <div>
                <strong>Relations :</strong><br />
                users → profiles → user_interests ← interests
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Structure des Données</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>users :</strong> Comptes et authentification (email, rôle, statut)</p>
                <p>• <strong>profiles :</strong> Informations personnelles (nom, téléphone, bio)</p>
                <p>• <strong>interests :</strong> Catalogue des centres d'intérêt</p>
                <p>• <strong>user_interests :</strong> Liaison many-to-many (utilisateur ↔ intérêts)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de Maintenance</CardTitle>
          <CardDescription>
            Outils pour initialiser et maintenir la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Initialisation</h4>
              <p className="text-sm text-gray-600">
                Crée les données par défaut (intérêts, utilisateurs demo)
              </p>
              <Button
                onClick={handleInitialize}
                disabled={actionLoading !== null}
                className="w-full"
              >
                {actionLoading === 'init' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Initialiser les données
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Réinitialisation</h4>
              <p className="text-sm text-gray-600">
                ⚠️ Supprime toutes les données et recrée les données par défaut
              </p>
              <Button
                onClick={handleReset}
                disabled={actionLoading !== null}
                variant="destructive"
                className="w-full"
              >
                {actionLoading === 'reset' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Réinitialiser (DANGER)
              </Button>
            </div>
          </div>

          {hasData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Comptes de démonstration disponibles :</strong><br />
                • Voyageur : demo@voyageur.com / demo123<br />
                • Admin : admin@gasyway.com / admin123
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}