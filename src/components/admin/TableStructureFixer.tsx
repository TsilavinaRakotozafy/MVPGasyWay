import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Database,
  RefreshCw,
  FileText,
  Settings
} from 'lucide-react'

interface ColumnCheck {
  table: string
  column: string
  expected: boolean
  exists: boolean
  status: 'ok' | 'missing' | 'error'
  error?: string
}

interface FixResult {
  success: boolean
  message: string
  details?: any
}

export function TableStructureFixer() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [columnChecks, setColumnChecks] = useState<ColumnCheck[]>([])
  const [fixResults, setFixResults] = useState<FixResult[]>([])

  // Structure attendue selon notre SQL
  const expectedColumns = [
    { table: 'users', column: 'id', required: true },
    { table: 'users', column: 'email', required: true },
    { table: 'users', column: 'role', required: true },
    { table: 'users', column: 'status', required: true },
    { table: 'users', column: 'gdpr_consent', required: true },
    { table: 'users', column: 'locale', required: true },
    { table: 'users', column: 'last_login', required: false },
    { table: 'users', column: 'created_at', required: true },
    { table: 'users', column: 'updated_at', required: true },
    
    { table: 'profiles', column: 'id', required: true },
    { table: 'profiles', column: 'user_id', required: true },
    { table: 'profiles', column: 'first_name', required: true },
    { table: 'profiles', column: 'last_name', required: true },
    { table: 'profiles', column: 'phone', required: true },
    { table: 'profiles', column: 'avatar_url', required: false },
    { table: 'profiles', column: 'bio', required: false },
    { table: 'profiles', column: 'created_at', required: true },
    { table: 'profiles', column: 'updated_at', required: true },
    
    { table: 'interests', column: 'id', required: true },
    { table: 'interests', column: 'label', required: true },
    { table: 'interests', column: 'created_at', required: true },
    { table: 'interests', column: 'updated_at', required: true },
    
    { table: 'user_interests', column: 'id', required: true },
    { table: 'user_interests', column: 'profile_id', required: true },
    { table: 'user_interests', column: 'interest_id', required: true },
    { table: 'user_interests', column: 'created_at', required: true }
  ]

  const checkColumnExists = async (tableName: string, columnName: string): Promise<ColumnCheck> => {
    try {
      // Essayer de sélectionner la colonne
      const { error } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist')) {
          return {
            table: tableName,
            column: columnName,
            expected: true,
            exists: false,
            status: 'missing'
          }
        } else {
          return {
            table: tableName,
            column: columnName,
            expected: true,
            exists: false,
            status: 'error',
            error: error.message
          }
        }
      }

      return {
        table: tableName,
        column: columnName,
        expected: true,
        exists: true,
        status: 'ok'
      }

    } catch (error: any) {
      return {
        table: tableName,
        column: columnName,
        expected: true,
        exists: false,
        status: 'error',
        error: error.message
      }
    }
  }

  const runStructureCheck = async () => {
    setChecking(true)
    setColumnChecks([])
    
    try {
      console.log('🔍 Vérification de la structure des tables...')
      
      const checks: ColumnCheck[] = []
      
      for (const col of expectedColumns) {
        console.log(`🔍 Vérification ${col.table}.${col.column}`)
        const check = await checkColumnExists(col.table, col.column)
        checks.push(check)
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setColumnChecks(checks)
      
      const missingColumns = checks.filter(c => c.status === 'missing')
      const errorColumns = checks.filter(c => c.status === 'error')
      
      if (errorColumns.length > 0) {
        toast.error(`🔥 ${errorColumns.length} erreurs de structure détectées`)
      } else if (missingColumns.length > 0) {
        toast.warning(`⚠️ ${missingColumns.length} colonnes manquantes détectées`)
      } else {
        toast.success('✅ Structure des tables correcte')
      }
      
    } catch (error: any) {
      console.error('❌ Erreur vérification structure:', error)
      toast.error(`Erreur lors de la vérification : ${error.message}`)
    } finally {
      setChecking(false)
    }
  }

  const getColumnBadge = (check: ColumnCheck) => {
    switch (check.status) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800">✅ OK</Badge>
      case 'missing':
        return <Badge variant="destructive">❌ Manquante</Badge>
      case 'error':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Erreur</Badge>
    }
  }

  const groupedChecks = columnChecks.reduce((groups, check) => {
    if (!groups[check.table]) {
      groups[check.table] = []
    }
    groups[check.table].push(check)
    return groups
  }, {} as Record<string, ColumnCheck[]>)

  const getTableStatus = (checks: ColumnCheck[]) => {
    const hasErrors = checks.some(c => c.status === 'error')
    const hasMissing = checks.some(c => c.status === 'missing')
    
    if (hasErrors) return 'error'
    if (hasMissing) return 'missing'
    return 'ok'
  }

  const getTableBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800">✅ Complète</Badge>
      case 'missing':
        return <Badge variant="destructive">❌ Colonnes manquantes</Badge>
      case 'error':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Erreurs</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            <CardTitle>Réparateur de structure SQL</CardTitle>
          </div>
          <CardDescription>
            Vérifier et diagnostiquer la structure de vos tables Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={runStructureCheck}
              disabled={checking}
              className="flex-1"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Vérifier la structure
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de la vérification */}
      {columnChecks.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedChecks).map(([tableName, checks]) => (
            <Card key={tableName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-lg">Table: {tableName}</CardTitle>
                  </div>
                  {getTableBadge(getTableStatus(checks))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {checks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{check.column}</span>
                      {getColumnBadge(check)}
                    </div>
                  ))}
                </div>
                
                {/* Erreurs détaillées */}
                {checks.some(c => c.error) && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Erreurs détectées :</h4>
                    {checks.filter(c => c.error).map((check, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{check.column}:</strong> {check.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions de correction */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-500" />
            <CardTitle>Comment corriger les problèmes détectés</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>✅ Pour recréer vos tables avec la bonne structure :</strong></p>
                <ol className="ml-4 space-y-1 text-sm">
                  <li>1. Connectez-vous à votre <a href="https://supabase.com/dashboard" target="_blank" className="underline">Dashboard Supabase</a></li>
                  <li>2. SQL Editor → New query</li>
                  <li>3. Copiez le contenu de votre fichier <code>/sql/create_tables.sql</code></li>
                  <li>4. Ajoutez <code>DROP TABLE IF EXISTS users, profiles, interests, user_interests CASCADE;</code> au début</li>
                  <li>5. Exécutez le script pour recréer les tables</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>⚠️ Attention - Cette opération va :</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Supprimer toutes vos données existantes</li>
                  <li>• Recréer les tables avec la bonne structure</li>
                  <li>• Nécessiter de réinsérer les données de démonstration</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>📋 Script SQL complet recommandé :</strong></p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
{`-- Supprimer les tables existantes
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Puis coller le contenu complet de /sql/create_tables.sql
-- Suivi de /sql/insert_demo_data.sql`}
                </pre>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}