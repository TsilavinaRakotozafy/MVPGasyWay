import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Info,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react'

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary: boolean
}

interface TableAnalysis {
  table_name: string
  exists: boolean
  columns: ColumnInfo[]
  issues: string[]
  status: 'ok' | 'warning' | 'error'
}

export function SupabaseTableInspector() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<TableAnalysis[]>([])

  const expectedUsersColumns = [
    'id', 'email', 'role', 'status', 'gdpr_consent', 'locale', 'last_login', 'created_at', 'updated_at'
  ]
  
  const forbiddenColumns = ['password', 'password_hash', 'encrypted_password', 'pass', 'pwd']

  const inspectTable = async (tableName: string): Promise<TableAnalysis> => {
    try {
      // Test 1: Vérifier que la table existe en essayant de faire une requête
      const { data: testData, error: testError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (testError) {
        return {
          table_name: tableName,
          exists: false,
          columns: [],
          issues: [`❌ Table "${tableName}" n'existe pas ou n'est pas accessible: ${testError.message}`],
          status: 'error'
        }
      }

      // Test 2: Essayer d'obtenir les informations de colonnes via une requête spéciale
      // On va faire une requête pour obtenir les colonnes disponibles
      try {
        // Faire une requête simple pour déclencher une erreur qui nous donnera les colonnes
        const { error: structError } = await supabase
          .from(tableName)
          .select('non_existent_column_to_trigger_error')
          .limit(1)

        let detectedColumns: string[] = []
        
        if (structError && structError.message) {
          // Chercher les noms de colonnes dans le message d'erreur
          const columnMatch = structError.message.match(/column "([^"]+)" does not exist/i)
          if (columnMatch) {
            // Si on a une erreur de colonne, on sait que la table existe
            // Essayons avec des colonnes connues
            for (const col of expectedUsersColumns) {
              try {
                const { error: colError } = await supabase
                  .from(tableName)
                  .select(col)
                  .limit(1)
                
                if (!colError) {
                  detectedColumns.push(col)
                }
              } catch (e) {
                // Ignorer les erreurs individuelles
              }
            }
            
            // Tester aussi les colonnes interdites
            for (const col of forbiddenColumns) {
              try {
                const { error: colError } = await supabase
                  .from(tableName)
                  .select(col)
                  .limit(1)
                
                if (!colError) {
                  detectedColumns.push(col)
                }
              } catch (e) {
                // Ignorer les erreurs individuelles
              }
            }
          }
        }

        // Analyser les colonnes détectées
        const columns: ColumnInfo[] = detectedColumns.map(col => ({
          column_name: col,
          data_type: 'unknown',
          is_nullable: 'unknown',
          column_default: null,
          is_primary: col === 'id'
        }))

        const issues: string[] = []
        let status: 'ok' | 'warning' | 'error' = 'ok'

        // Vérifier les colonnes interdites
        const foundForbidden = detectedColumns.filter(col => 
          forbiddenColumns.includes(col.toLowerCase())
        )
        
        if (foundForbidden.length > 0) {
          issues.push(`🔥 COLONNE(S) INTERDITE(S) DÉTECTÉE(S): ${foundForbidden.join(', ')}`)
          issues.push(`   → Ces colonnes ne devraient PAS exister avec Supabase Auth`)
          status = 'error'
        }

        // Vérifier les colonnes manquantes importantes
        if (tableName === 'users') {
          const criticalColumns = ['id', 'email']
          const missingCritical = criticalColumns.filter(col => 
            !detectedColumns.includes(col)
          )
          
          if (missingCritical.length > 0) {
            issues.push(`⚠️ Colonnes critiques manquantes: ${missingCritical.join(', ')}`)
            if (status !== 'error') status = 'warning'
          }
        }

        if (detectedColumns.length === 0) {
          issues.push('⚠️ Aucune colonne détectée - structure inconnue')
          if (status !== 'error') status = 'warning'
        }

        return {
          table_name: tableName,
          exists: true,
          columns,
          issues,
          status
        }

      } catch (inspectionError: any) {
        return {
          table_name: tableName,
          exists: true,
          columns: [],
          issues: [`⚠️ Impossible d'inspecter la structure: ${inspectionError.message}`],
          status: 'warning'
        }
      }

    } catch (error: any) {
      return {
        table_name: tableName,
        exists: false,
        columns: [],
        issues: [`❌ Erreur lors de l'inspection: ${error.message}`],
        status: 'error'
      }
    }
  }

  const runInspection = async () => {
    setLoading(true)
    try {
      console.log('🔍 Inspection des tables Supabase...')
      
      const tablesToInspect = ['users', 'profiles', 'interests', 'user_interests']
      const results: TableAnalysis[] = []
      
      for (const tableName of tablesToInspect) {
        console.log(`🔍 Inspection de la table: ${tableName}`)
        const result = await inspectTable(tableName)
        results.push(result)
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      setAnalysis(results)
      
      const hasErrors = results.some(r => r.status === 'error')
      const hasWarnings = results.some(r => r.status === 'warning')
      
      if (hasErrors) {
        toast.error('🔥 Problèmes critiques détectés dans la base de données')
      } else if (hasWarnings) {
        toast.warning('⚠️ Avertissements détectés dans la base de données')
      } else {
        toast.success('✅ Structure de base de données analysée')
      }
      
    } catch (error: any) {
      console.error('❌ Erreur inspection:', error)
      toast.error(`Erreur lors de l'inspection : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800">✅ OK</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Attention</Badge>
      case 'error':
        return <Badge variant="destructive">🔥 Erreur</Badge>
    }
  }

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Inspecteur de tables Supabase</CardTitle>
          </div>
          <CardDescription>
            Analyse en temps réel de la structure de vos tables Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runInspection}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inspection en cours...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Inspecter les tables
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Résultats de l'inspection */}
      {analysis.length > 0 && (
        <div className="space-y-4">
          {analysis.map((table, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(table.status)}
                    <CardTitle className="text-lg">Table: {table.table_name}</CardTitle>
                  </div>
                  {getStatusBadge(table.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existence de la table */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Existence:</span>
                  <Badge variant={table.exists ? "default" : "destructive"}>
                    {table.exists ? "✅ Existe" : "❌ Introuvable"}
                  </Badge>
                </div>

                {/* Colonnes détectées */}
                {table.exists && table.columns.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Colonnes détectées ({table.columns.length}):</span>
                    <div className="flex flex-wrap gap-2">
                      {table.columns.map((col, colIndex) => (
                        <Badge 
                          key={colIndex}
                          variant={
                            forbiddenColumns.includes(col.column_name.toLowerCase()) 
                              ? "destructive" 
                              : col.is_primary 
                                ? "default" 
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {col.column_name}
                          {col.is_primary && " (PK)"}
                          {forbiddenColumns.includes(col.column_name.toLowerCase()) && " ⚠️"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues */}
                {table.issues.length > 0 && (
                  <div className="space-y-2">
                    {table.issues.map((issue, issueIndex) => (
                      <Alert 
                        key={issueIndex} 
                        variant={issue.includes('🔥') ? "destructive" : "default"}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Colonnes attendues pour users */}
                {table.table_name === 'users' && table.exists && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Colonnes attendues pour users:</span>
                    <div className="text-xs bg-gray-50 p-2 rounded">
                      {expectedUsersColumns.join(', ')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle>Comment corriger les erreurs détectées</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>🔥 Si password_hash est détecté :</strong></p>
                <ol className="ml-4 space-y-1 text-sm">
                  <li>1. Connectez-vous à votre <a href="https://supabase.com/dashboard" target="_blank" className="underline">Dashboard Supabase</a></li>
                  <li>2. Table Editor → users</li>
                  <li>3. Cliquez sur la colonne "password_hash"</li>
                  <li>4. Menu ⋮ → "Delete column"</li>
                  <li>5. Confirmez la suppression</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>✅ Avec Supabase Auth :</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• Les mots de passe sont gérés dans <code>auth.users.encrypted_password</code></li>
                  <li>• Votre table <code>public.users</code> ne contient que les métadonnées</li>
                  <li>• Aucune gestion manuelle de mots de passe requise</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}