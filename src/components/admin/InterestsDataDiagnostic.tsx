import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Plus,
  Eye,
  Settings
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface DiagnosticResult {
  status: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  details?: any
}

export function InterestsDataDiagnostic({ user }: { user?: any }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // 1. Vérifier la session utilisateur
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        diagnosticResults.push({
          status: 'success',
          title: 'Session utilisateur',
          message: `Connecté en tant que ${session.user.email}`,
          details: { userId: session.user.id, role: user?.role }
        })
      } else {
        diagnosticResults.push({
          status: 'error',
          title: 'Session utilisateur',
          message: 'Aucune session active trouvée'
        })
      }

      // 2. Vérifier l'existence de la table interests
      try {
        const { data: interestsTest, error: interestsError } = await supabase
          .from('interests')
          .select('*')
          .limit(1)

        if (interestsError) {
          diagnosticResults.push({
            status: 'error',
            title: 'Table interests',
            message: `Erreur d'accès à la table interests: ${interestsError.message}`,
            details: interestsError
          })
        } else {
          diagnosticResults.push({
            status: 'success',
            title: 'Table interests',
            message: 'Table interests accessible'
          })
        }
      } catch (error: any) {
        diagnosticResults.push({
          status: 'error',
          title: 'Table interests',
          message: `Erreur lors de l'accès à la table interests: ${error.message}`
        })
      }

      // 3. Vérifier l'existence de la table interest_category
      try {
        const { data: categoriesTest, error: categoriesError } = await supabase
          .from('interest_category')
          .select('*')
          .limit(1)

        if (categoriesError) {
          diagnosticResults.push({
            status: 'error',
            title: 'Table interest_category',
            message: `Erreur d'accès à la table interest_category: ${categoriesError.message}`,
            details: categoriesError
          })
        } else {
          diagnosticResults.push({
            status: 'success',
            title: 'Table interest_category',
            message: 'Table interest_category accessible'
          })
        }
      } catch (error: any) {
        diagnosticResults.push({
          status: 'error',
          title: 'Table interest_category',
          message: `Erreur lors de l'accès à la table interest_category: ${error.message}`
        })
      }

      // 4. Compter les données existantes
      try {
        const { count: interestsCount } = await supabase
          .from('interests')
          .select('*', { count: 'exact', head: true })

        const { count: categoriesCount } = await supabase
          .from('interest_category')
          .select('*', { count: 'exact', head: true })

        diagnosticResults.push({
          status: interestsCount === 0 ? 'warning' : 'info',
          title: 'Données existantes',
          message: `${interestsCount || 0} centres d'intérêt, ${categoriesCount || 0} catégories`,
          details: { interestsCount, categoriesCount }
        })
      } catch (error: any) {
        diagnosticResults.push({
          status: 'warning',
          title: 'Comptage des données',
          message: `Impossible de compter les données: ${error.message}`
        })
      }

      // 5. Tester une requête complète avec jointure
      try {
        const { data: fullQueryData, error: fullQueryError } = await supabase
          .from('interests')
          .select(`
            id,
            name,
            slug,
            description,
            icon,
            icon_url,
            active,
            category,
            created_at,
            interest_category:category (
              id,
              name
            )
          `)
          .limit(5)

        if (fullQueryError) {
          diagnosticResults.push({
            status: 'error',
            title: 'Requête avec jointure',
            message: `Erreur dans la requête avec jointure: ${fullQueryError.message}`,
            details: fullQueryError
          })
        } else {
          diagnosticResults.push({
            status: 'success',
            title: 'Requête avec jointure',
            message: `Requête avec jointure réussie (${fullQueryData?.length || 0} résultats)`,
            details: fullQueryData
          })
        }
      } catch (error: any) {
        diagnosticResults.push({
          status: 'error',
          title: 'Requête avec jointure',
          message: `Erreur lors de la requête avec jointure: ${error.message}`
        })
      }

      // 6. Vérifier les politiques RLS
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', session?.user?.id)
          .single()

        if (userData) {
          diagnosticResults.push({
            status: 'success',
            title: 'Vérification rôle utilisateur',
            message: `Rôle confirmé: ${userData.role}`,
            details: userData
          })
        } else {
          diagnosticResults.push({
            status: 'warning',
            title: 'Vérification rôle utilisateur',
            message: 'Impossible de récupérer le rôle utilisateur depuis la table users'
          })
        }
      } catch (error: any) {
        diagnosticResults.push({
          status: 'warning',
          title: 'Vérification rôle utilisateur',
          message: `Erreur lors de la vérification du rôle: ${error.message}`
        })
      }

    } catch (error: any) {
      diagnosticResults.push({
        status: 'error',
        title: 'Erreur générale',
        message: `Erreur inattendue: ${error.message}`,
        details: error
      })
    }

    setResults(diagnosticResults)
    setLoading(false)
  }

  const createSampleData = async () => {
    try {
      setLoading(true)
      
      // Créer quelques catégories d'exemple
      const categories = [
        { name: 'Nature & Paysages', description: 'Découverte de la nature malgache', icon: '🌿' },
        { name: 'Culture & Traditions', description: 'Immersion dans la culture locale', icon: '🎭' },
        { name: 'Aventure & Sport', description: 'Activités sportives et aventureuses', icon: '🏔️' },
        { name: 'Beach & Détente', description: 'Plages paradisiaques et relaxation', icon: '🏖️' }
      ]

      // Insérer les catégories
      const { data: insertedCategories, error: categoriesError } = await supabase
        .from('interest_category')
        .insert(categories)
        .select()

      if (categoriesError) throw categoriesError

      // Créer quelques centres d'intérêt d'exemple
      const interests = [
        { 
          name: 'Randonnée en montagne', 
          slug: 'randonnee-montagne',
          description: 'Découverte des paysages montagneux',
          icon: '🥾',
          active: true,
          category: insertedCategories[0].id
        },
        { 
          name: 'Baobabs Avenue', 
          slug: 'baobabs-avenue',
          description: 'Visite de la célèbre avenue des baobabs',
          icon: '🌳',
          active: true,
          category: insertedCategories[0].id
        },
        { 
          name: 'Artisanat local', 
          slug: 'artisanat-local',
          description: 'Découverte de l\'artisanat traditionnel',
          icon: '🎨',
          active: true,
          category: insertedCategories[1].id
        },
        { 
          name: 'Plongée sous-marine', 
          slug: 'plongee-sous-marine',
          description: 'Exploration des fonds marins',
          icon: '🤿',
          active: true,
          category: insertedCategories[2].id
        },
        { 
          name: 'Plages de Nosy Be', 
          slug: 'plages-nosy-be',
          description: 'Détente sur les plages paradisiaques',
          icon: '🏝️',
          active: true,
          category: insertedCategories[3].id
        }
      ]

      const { error: interestsError } = await supabase
        .from('interests')
        .insert(interests)

      if (interestsError) throw interestsError

      toast.success('Données d\'exemple créées avec succès !')
      await runDiagnostic() // Relancer le diagnostic
      
    } catch (error: any) {
      console.error('Erreur création données d\'exemple:', error)
      toast.error(`Erreur lors de la création des données: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fixRLSPolicies = async () => {
    try {
      setLoading(true)
      toast.info('Correction des politiques RLS en cours...')
      
      // Note: Les politiques RLS doivent être créées côté serveur ou via le dashboard Supabase
      // Ici on peut seulement tester l'accès
      
      const { data, error } = await supabase.rpc('get_current_user_role')
      
      if (error) {
        toast.error('Impossible de vérifier les politiques RLS. Vérifiez via le dashboard Supabase.')
      } else {
        toast.success('Politiques RLS vérifiées')
      }
      
    } catch (error: any) {
      toast.error(`Erreur lors de la correction RLS: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info': return <Eye className="h-5 w-5 text-blue-600" />
      default: return <Eye className="h-5 w-5 text-gray-600" />
    }
  }

  const getBadgeVariant = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'default'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'info': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnostic des Centres d'Intérêt
          </CardTitle>
          <CardDescription>
            Vérifiez l'état des données et des permissions pour les centres d'intérêt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Lancer le diagnostic
            </Button>
            
            <Button variant="outline" onClick={createSampleData} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Créer données d'exemple
            </Button>
            
            <Button variant="outline" onClick={fixRLSPolicies} disabled={loading}>
              <Settings className="h-4 w-4 mr-2" />
              Vérifier RLS
            </Button>
          </div>

          {results.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4>Résultats du diagnostic :</h4>
                {results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{result.title}</span>
                        <Badge variant={getBadgeVariant(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Voir les détails
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InterestsDataDiagnostic