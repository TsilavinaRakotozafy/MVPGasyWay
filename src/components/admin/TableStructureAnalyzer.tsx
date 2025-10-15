import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Table,
  Info
} from 'lucide-react'

export function TableStructureAnalyzer() {
  const [loading, setLoading] = useState(false)
  const [structures, setStructures] = useState<any>(null)

  const analyzeTableStructures = async () => {
    setLoading(true)
    try {
      console.log('🔍 Analyse des structures de tables...')

      // Analyser en testant les opérations réelles au lieu des métadonnées
      let interestsColumns: any[] = []
      let interestsError: string | null = null
      
      try {
        // Tenter de créer et insérer avec différents champs pour voir lesquels sont requis
        const testSets = [
          // Test minimal
          { name: 'Test-Minimal' },
          // Test avec status
          { name: 'Test-Status', status: 'active' },
          // Test complet
          { name: 'Test-Complet', status: 'active', slug: 'test-complet', description: 'Test', icon_url: 'test.png' }
        ]

        for (const testData of testSets) {
          try {
            const { data: testResult, error: testError } = await supabase
              .from('interests')
              .insert(testData)
              .select()
              .single()

            if (!testError && testResult) {
              // Succès - récupérer la structure depuis l'objet retourné
              interestsColumns = Object.keys(testResult).map(key => ({
                column_name: key,
                data_type: typeof testResult[key],
                is_nullable: testResult[key] === null ? 'YES' : 'NO',
                column_default: null,
                test_success: true
              }))
              
              // Nettoyer
              await supabase.from('interests').delete().eq('id', testResult.id)
              break
            }
          } catch (e) {
            console.log(`Test ${JSON.stringify(testData)} échoué:`, e)
          }
        }
      } catch (error: any) {
        interestsError = error.message
      }

      let userInterestsColumns: any[] = []
      let userInterestsError: string | null = null

      // Test simple pour user_interests  
      try {
        const { data: sampleUserInterest } = await supabase
          .from('user_interests')
          .select('*')
          .limit(1)
          .single()

        if (sampleUserInterest) {
          userInterestsColumns = Object.keys(sampleUserInterest).map(key => ({
            column_name: key,
            data_type: typeof sampleUserInterest[key],
            is_nullable: sampleUserInterest[key] === null ? 'YES' : 'NO',
            column_default: null
          }))
        }
      } catch (error: any) {
        // Si pas de données, essayer la structure depuis les erreurs d'insertion
        try {
          const { error: insertError } = await supabase
            .from('user_interests')
            .insert({})

          if (insertError) {
            userInterestsError = insertError.message
            // Extraire les champs requis depuis le message d'erreur
            if (insertError.message.includes('null value')) {
              const matches = insertError.message.match(/column "([^"]+)"/g)
              if (matches) {
                userInterestsColumns = matches.map(match => ({
                  column_name: match.replace(/[column "]/g, ''),
                  data_type: 'unknown',
                  is_nullable: 'NO',
                  column_default: null,
                  required: true
                }))
              }
            }
          }
        } catch (e) {
          userInterestsError = (e as any).message
        }
      }

      const constraints: any[] = []
      const constraintsError = null

      const results = {
        interests: {
          columns: interestsColumns || [],
          error: interestsError?.message
        },
        user_interests: {
          columns: userInterestsColumns || [],
          error: userInterestsError?.message
        },
        constraints: {
          data: constraints || [],
          error: constraintsError?.message
        }
      }

      setStructures(results)
      console.log('📊 Structures de tables analysées:', results)

    } catch (error: any) {
      console.error('❌ Erreur analyse structure:', error)
      toast.error('Erreur lors de l\'analyse')
    } finally {
      setLoading(false)
    }
  }

  const testInterestCreation = async () => {
    try {
      toast.info('🧪 Test de création d\'un centre d\'intérêt...')
      
      const testData = {
        name: `Test-${Date.now()}`,
        status: 'active'
      }

      console.log('🔄 Tentative d\'insertion avec données minimales:', testData)

      const { data, error } = await supabase
        .from('interests')
        .insert(testData)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur test insertion:', error)
        toast.error(`Erreur: ${error.message}`)
        return
      }

      console.log('✅ Test réussi:', data)
      toast.success('Test de création réussi!')

      // Nettoyer le test
      await supabase
        .from('interests')
        .delete()
        .eq('id', data.id)

      console.log('🧹 Données de test nettoyées')

    } catch (error: any) {
      console.error('❌ Erreur test:', error)
      toast.error('Erreur lors du test')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          Analyseur de Structure de Tables
        </CardTitle>
        <CardDescription>
          Analyse la structure réelle des tables pour identifier les champs requis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex gap-2">
          <Button onClick={analyzeTableStructures} disabled={loading} variant="outline">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Analyser les structures
              </>
            )}
          </Button>

          <Button onClick={testInterestCreation} disabled={loading} variant="default">
            <CheckCircle className="mr-2 h-4 w-4" />
            Tester création
          </Button>
        </div>

        {structures && (
          <div className="space-y-4">
            
            {/* Table interests */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table "interests"
              </h3>
              
              {structures.interests.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erreur: {structures.interests.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {structures.interests.columns.map((col: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{col.column_name}</span>
                        <Badge variant="outline" size="sm">
                          {col.data_type}
                        </Badge>
                        {col.is_nullable === 'NO' && (
                          <Badge variant="destructive" size="sm">Requis</Badge>
                        )}
                        {col.column_default && (
                          <Badge variant="secondary" size="sm">Auto</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {col.character_maximum_length && `Max: ${col.character_maximum_length}`}
                        {col.column_default && ` Default: ${col.column_default}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Table user_interests */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table "user_interests"
              </h3>
              
              {structures.user_interests.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erreur: {structures.user_interests.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {structures.user_interests.columns.map((col: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{col.column_name}</span>
                        <Badge variant="outline" size="sm">
                          {col.data_type}
                        </Badge>
                        {col.is_nullable === 'NO' && (
                          <Badge variant="destructive" size="sm">Requis</Badge>
                        )}
                        {col.column_default && (
                          <Badge variant="secondary" size="sm">Auto</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {col.character_maximum_length && `Max: ${col.character_maximum_length}`}
                        {col.column_default && ` Default: ${col.column_default}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contraintes */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Contraintes
              </h3>
              
              {structures.constraints.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erreur: {structures.constraints.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {structures.constraints.data.map((constraint: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Badge variant="outline" size="sm">
                        {constraint.table_name}
                      </Badge>
                      <span className="text-sm">{constraint.constraint_name}</span>
                      <Badge variant="secondary" size="sm">
                        {constraint.constraint_type}
                      </Badge>
                      <span className="font-mono text-xs text-gray-600">
                        {constraint.column_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Conseils pour la création :</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Les champs marqués <Badge variant="destructive" size="sm" className="mx-1">Requis</Badge> doivent être fournis</li>
                  <li>• Les champs marqués <Badge variant="secondary" size="sm" className="mx-1">Auto</Badge> sont générés automatiquement</li>
                  <li>• Utilisez "Tester création" pour valider les champs minimum requis</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}