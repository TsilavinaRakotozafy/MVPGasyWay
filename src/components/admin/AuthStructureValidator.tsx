import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { AlertTriangle, CheckCircle, Database, RefreshCw, Users, Eye } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'

interface ValidationResult {
  test: string
  status: 'success' | 'warning' | 'error'
  message: string
  details?: any
}

interface TableInfo {
  name: string
  count: number
  columns: string[]
  hasIssues: boolean
  issues: string[]
}

export function AuthStructureValidator() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ValidationResult[]>([])
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([])

  const runValidation = async () => {
    setLoading(true)
    setResults([])
    setTableInfo([])

    const validationResults: ValidationResult[] = []
    const tables: TableInfo[] = []

    try {
      // Test 1: Vérifier l'existence de la table users
      try {
        const { data: usersData, error: usersError, count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (usersError) {
          validationResults.push({
            test: 'Table users',
            status: 'error',
            message: `Table users inaccessible: ${usersError.message}`,
            details: usersError
          })
        } else {
          validationResults.push({
            test: 'Table users',
            status: 'success',
            message: `Table users accessible avec ${count || 0} enregistrements`
          })

          // Analyser la structure de la table users
          const { data: sampleUser } = await supabase
            .from('users')
            .select('*')
            .limit(1)
            .maybeSingle()

          const userColumns = sampleUser ? Object.keys(sampleUser) : []
          const requiredColumns = ['id', 'email', 'status', 'role', 'first_login_completed']
          const missingColumns = requiredColumns.filter(col => !userColumns.includes(col))
          
          tables.push({
            name: 'users',
            count: count || 0,
            columns: userColumns,
            hasIssues: missingColumns.length > 0,
            issues: missingColumns.map(col => `Colonne manquante: ${col}`)
          })

          if (missingColumns.length > 0) {
            validationResults.push({
              test: 'Colonnes requises',
              status: 'error',
              message: `Colonnes manquantes: ${missingColumns.join(', ')}`
            })
          } else {
            validationResults.push({
              test: 'Colonnes requises',
              status: 'success',
              message: 'Toutes les colonnes requises sont présentes'
            })
          }
        }
      } catch (error: any) {
        validationResults.push({
          test: 'Table users',
          status: 'error',
          message: `Erreur critique: ${error.message}`,
          details: error
        })
      }

      // Test 2: Vérifier les doublons
      try {
        const { data: duplicatesData } = await supabase
          .rpc('get_duplicate_users_by_email')
          .select('*')

        // Si la fonction n'existe pas, on fait une vérification manuelle
        if (!duplicatesData) {
          const { data: allUsers } = await supabase
            .from('users')
            .select('id, email')

          if (allUsers) {
            const emailGroups: { [email: string]: number } = {}
            allUsers.forEach(user => {
              emailGroups[user.email] = (emailGroups[user.email] || 0) + 1
            })

            const duplicateEmails = Object.entries(emailGroups)
              .filter(([_, count]) => count > 1)

            if (duplicateEmails.length > 0) {
              validationResults.push({
                test: 'Doublons utilisateurs',
                status: 'error',
                message: `${duplicateEmails.length} emails avec doublons détectés`,
                details: duplicateEmails
              })
            } else {
              validationResults.push({
                test: 'Doublons utilisateurs',
                status: 'success',
                message: 'Aucun doublon détecté'
              })
            }
          }
        }
      } catch (error: any) {
        validationResults.push({
          test: 'Doublons utilisateurs',
          status: 'warning',
          message: `Impossible de vérifier les doublons: ${error.message}`
        })
      }

      // Test 3: Vérifier les utilisateurs avec des champs null critiques
      try {
        const { data: usersWithNullStatus } = await supabase
          .from('users')
          .select('id, email, status, role')
          .is('status', null)

        const { data: usersWithNullRole } = await supabase
          .from('users')
          .select('id, email, status, role')
          .is('role', null)

        if (usersWithNullStatus && usersWithNullStatus.length > 0) {
          validationResults.push({
            test: 'Champs status null',
            status: 'warning',
            message: `${usersWithNullStatus.length} utilisateurs avec status null`,
            details: usersWithNullStatus
          })
        } else {
          validationResults.push({
            test: 'Champs status null',
            status: 'success',
            message: 'Tous les utilisateurs ont un status défini'
          })
        }

        if (usersWithNullRole && usersWithNullRole.length > 0) {
          validationResults.push({
            test: 'Champs role null',
            status: 'warning',
            message: `${usersWithNullRole.length} utilisateurs avec role null`,
            details: usersWithNullRole
          })
        } else {
          validationResults.push({
            test: 'Champs role null',
            status: 'success',
            message: 'Tous les utilisateurs ont un role défini'
          })
        }
      } catch (error: any) {
        validationResults.push({
          test: 'Validation champs null',
          status: 'error',
          message: `Erreur validation: ${error.message}`
        })
      }

      // Test 4: Vérifier les politiques RLS
      try {
        // Tenter une requête avec RLS pour voir si elle fonctionne
        const { data: rlsTest, error: rlsError } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        if (rlsError && rlsError.message.includes('RLS')) {
          validationResults.push({
            test: 'Politiques RLS',
            status: 'warning',
            message: 'Problème RLS détecté, peut nécessiter des ajustements'
          })
        } else {
          validationResults.push({
            test: 'Politiques RLS',
            status: 'success',
            message: 'RLS fonctionne correctement'
          })
        }
      } catch (error: any) {
        validationResults.push({
          test: 'Politiques RLS',
          status: 'warning',
          message: `Test RLS: ${error.message}`
        })
      }

      setResults(validationResults)
      setTableInfo(tables)

      const errorCount = validationResults.filter(r => r.status === 'error').length
      const warningCount = validationResults.filter(r => r.status === 'warning').length

      if (errorCount > 0) {
        toast.error(`Validation terminée avec ${errorCount} erreurs et ${warningCount} avertissements`)
      } else if (warningCount > 0) {
        toast.warning(`Validation terminée avec ${warningCount} avertissements`)
      } else {
        toast.success('Validation réussie ! Structure auth correcte.')
      }

    } catch (error: any) {
      console.error('❌ Erreur validation:', error)
      toast.error('Erreur lors de la validation')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: ValidationResult['status']) => {
    const variants = {
      success: 'default',
      warning: 'secondary', 
      error: 'destructive'
    }
    return variants[status] as any
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Validateur Structure Auth
          </CardTitle>
          <CardDescription>
            Diagnostique la structure de la base de données d'authentification 
            pour identifier les problèmes potentiels causant les erreurs null.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runValidation}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Database className="h-4 w-4 mr-2" />
            {loading ? 'Validation en cours...' : 'Valider la structure'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <Badge variant={getStatusBadge(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Détails techniques
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tableInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Information Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tableInfo.map((table, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {table.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge>{table.count} enregistrements</Badge>
                    {table.hasIssues && (
                      <Badge variant="destructive">Problèmes détectés</Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <p><strong>Colonnes ({table.columns.length}):</strong> {table.columns.join(', ')}</p>
                  
                  {table.issues.length > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium text-red-800">Problèmes:</p>
                      <ul className="list-disc list-inside text-red-700">
                        {table.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Guide de Résolution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Erreurs courantes et solutions :</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Table users inaccessible :</strong> Vérifiez les politiques RLS</li>
            <li><strong>Colonnes manquantes :</strong> Exécutez les migrations SQL nécessaires</li>
            <li><strong>Doublons utilisateurs :</strong> Utilisez le "Correcteur Doublons"</li>
            <li><strong>Champs null :</strong> Définissez des valeurs par défaut</li>
            <li><strong>Problèmes RLS :</strong> Vérifiez les politiques de sécurité</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}