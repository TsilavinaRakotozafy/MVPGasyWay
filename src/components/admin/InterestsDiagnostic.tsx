import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { useAuth } from '../../contexts/AuthContextSQL'
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Heart,
  User,
  Shield
} from 'lucide-react'

export function InterestsDiagnostic() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState<any>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    const results: any = {}

    try {
      console.log('🔍 Diagnostic centres d\'intérêt - Début')

      // Test 1: Accès table interests
      try {
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('id, name, status')
          .limit(5)

        results.interests = {
          accessible: !interestsError,
          error: interestsError?.message,
          count: interestsData?.length || 0,
          data: interestsData
        }
      } catch (error: any) {
        results.interests = {
          accessible: false,
          error: error.message,
          count: 0
        }
      }

      // Test 2: Accès table user_interests
      if (user) {
        try {
          const { data: userInterestsData, error: userInterestsError } = await supabase
            .from('user_interests')
            .select('user_id, interest_id')
            .eq('user_id', user.id)

          results.user_interests = {
            accessible: !userInterestsError,
            error: userInterestsError?.message,
            count: userInterestsData?.length || 0,
            data: userInterestsData
          }
        } catch (error: any) {
          results.user_interests = {
            accessible: false,
            error: error.message,
            count: 0
          }
        }

        // Test 3: Test d'insertion dans user_interests
        try {
          const testInsert = {
            user_id: user.id,
            interest_id: 'test-id-123',
            created_at: new Date().toISOString()
          }

          const { error: insertError } = await supabase
            .from('user_interests')
            .insert(testInsert)

          if (!insertError) {
            // Nettoyer le test
            await supabase
              .from('user_interests')
              .delete()
              .eq('user_id', user.id)
              .eq('interest_id', 'test-id-123')
          }

          results.insert_test = {
            success: !insertError,
            error: insertError?.message
          }
        } catch (error: any) {
          results.insert_test = {
            success: false,
            error: error.message
          }
        }

        // Test 4: Test de suppression dans user_interests
        try {
          const { error: deleteError } = await supabase
            .from('user_interests')
            .delete()
            .eq('user_id', user.id)
            .eq('interest_id', 'non-existent-id')

          results.delete_test = {
            success: !deleteError,
            error: deleteError?.message
          }
        } catch (error: any) {
          results.delete_test = {
            success: false,
            error: error.message
          }
        }
      }

      // Test 5: Vérification structure tables
      try {
        const { data: interestsColumns } = await supabase
          .rpc('get_table_columns', { table_name: 'interests' })
          .single()

        results.table_structure = {
          interests_exists: true,
          interests_columns: interestsColumns
        }
      } catch (error: any) {
        results.table_structure = {
          interests_exists: false,
          error: error.message
        }
      }

      setDiagnostic(results)
      console.log('📊 Résultats diagnostic centres d\'intérêt:', results)

    } catch (error: any) {
      console.error('❌ Erreur diagnostic centres d\'intérêt:', error)
      toast.error('Erreur lors du diagnostic')
    } finally {
      setLoading(false)
    }
  }

  const fixCommonIssues = async () => {
    if (!user) return

    try {
      toast.info('🔧 Tentative de réparation automatique...')

      // Vérifier et créer des intérêts de base si aucun n'existe
      const { data: existingInterests } = await supabase
        .from('interests')
        .select('id')
        .limit(1)

      if (!existingInterests || existingInterests.length === 0) {
        console.log('📝 Création d\'intérêts de base...')
        
        const basicInterests = [
          { name: 'Aventure', status: 'active' },
          { name: 'Culture', status: 'active' },
          { name: 'Nature', status: 'active' },
          { name: 'Gastronomie', status: 'active' },
          { name: 'Plage', status: 'active' }
        ]

        const { error: insertError } = await supabase
          .from('interests')
          .insert(basicInterests)

        if (insertError) {
          console.error('❌ Erreur création intérêts de base:', insertError)
          throw insertError
        }

        toast.success('✅ Intérêts de base créés')
      }

      // Re-lancer le diagnostic
      await runDiagnostic()

    } catch (error: any) {
      console.error('❌ Erreur réparation:', error)
      toast.error('Erreur lors de la réparation automatique')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Diagnostic Centres d'Intérêt
        </CardTitle>
        <CardDescription>
          Diagnostique les problèmes liés aux centres d'intérêt et à l'étape de finalisation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={loading} variant="outline">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Diagnostic...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Lancer diagnostic
              </>
            )}
          </Button>

          <Button onClick={fixCommonIssues} disabled={loading || !user} variant="default">
            <Shield className="mr-2 h-4 w-4" />
            Réparation auto
          </Button>
        </div>

        {!user && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              Vous devez être connecté pour diagnostiquer les centres d'intérêt utilisateur.
            </AlertDescription>
          </Alert>
        )}

        {diagnostic && (
          <div className="space-y-3">
            <h3 className="font-medium">Résultats du diagnostic :</h3>
            
            {/* Table interests */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Table "interests"</span>
                <Badge variant={diagnostic.interests?.accessible ? "default" : "destructive"}>
                  {diagnostic.interests?.accessible ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      OK ({diagnostic.interests.count} intérêts)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Erreur
                    </>
                  )}
                </Badge>
              </div>
              {diagnostic.interests?.error && (
                <p className="text-sm text-red-600">{diagnostic.interests.error}</p>
              )}
            </div>

            {/* Table user_interests */}
            {user && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Table "user_interests"</span>
                  <Badge variant={diagnostic.user_interests?.accessible ? "default" : "destructive"}>
                    {diagnostic.user_interests?.accessible ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        OK ({diagnostic.user_interests.count} relations)
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Erreur
                      </>
                    )}
                  </Badge>
                </div>
                {diagnostic.user_interests?.error && (
                  <p className="text-sm text-red-600">{diagnostic.user_interests.error}</p>
                )}
              </div>
            )}

            {/* Tests d'écriture */}
            {user && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tests d'écriture</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Insertion:</span>
                    <Badge variant={diagnostic.insert_test?.success ? "default" : "destructive"} size="sm">
                      {diagnostic.insert_test?.success ? "OK" : "Erreur"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Suppression:</span>
                    <Badge variant={diagnostic.delete_test?.success ? "default" : "destructive"} size="sm">
                      {diagnostic.delete_test?.success ? "OK" : "Erreur"}
                    </Badge>
                  </div>
                </div>
                {(diagnostic.insert_test?.error || diagnostic.delete_test?.error) && (
                  <div className="mt-2 text-sm text-red-600">
                    {diagnostic.insert_test?.error && <p>Insert: {diagnostic.insert_test.error}</p>}
                    {diagnostic.delete_test?.error && <p>Delete: {diagnostic.delete_test.error}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Recommandations */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Solutions recommandées :</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {!diagnostic.interests?.accessible && (
                    <li>• Vérifiez les politiques RLS sur la table "interests"</li>
                  )}
                  {diagnostic.interests?.count === 0 && (
                    <li>• Aucun centre d'intérêt en base - utilisez "Réparation auto"</li>
                  )}
                  {!diagnostic.user_interests?.accessible && (
                    <li>• Vérifiez les politiques RLS sur la table "user_interests"</li>
                  )}
                  {!diagnostic.insert_test?.success && (
                    <li>• Problème d'insertion - vérifiez les permissions</li>
                  )}
                  {!diagnostic.delete_test?.success && (
                    <li>• Problème de suppression - vérifiez les permissions</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}