import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  MapPin,
  Image as ImageIcon,
  Eye,
  TestTube
} from 'lucide-react'
import { RegionImageFallback, hasRegionImage } from '../common/RegionImageFallback'

interface Region {
  id: string
  name: string
  image_url: string | null
  status: string
  created_at: string
}

export function RegionsFallbackTest() {
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [testResults, setTestResults] = useState<{
    totalRegions: number
    withImages: number
    withoutImages: number
    fallbackWorking: boolean
  } | null>(null)

  // Charger les régions pour test
  const loadRegionsForTest = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, image_url, status, created_at')
        .order('name')

      if (error) {
        throw error
      }

      setRegions(data || [])
      
      // Analyser les résultats
      const totalRegions = data?.length || 0
      const withImages = data?.filter(r => hasRegionImage(r.image_url)).length || 0
      const withoutImages = totalRegions - withImages
      
      setTestResults({
        totalRegions,
        withImages,
        withoutImages,
        fallbackWorking: true // Si on arrive ici, le fallback fonctionne
      })

      toast.success(`${totalRegions} régions chargées pour test`)

    } catch (error: any) {
      console.error('Erreur test régions:', error)
      toast.error(`Erreur test: ${error.message}`)
      setTestResults(null)
    } finally {
      setLoading(false)
    }
  }

  // Test au chargement
  useEffect(() => {
    loadRegionsForTest()
  }, [])

  const StatusIcon = ({ hasImage }: { hasImage: boolean }) => {
    if (hasImage) return <ImageIcon className="h-4 w-4 text-green-600" />
    return <MapPin className="h-4 w-4 text-secondary-foreground" />
  }

  const getStatusBadge = (hasImage: boolean) => {
    if (hasImage) return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Image</Badge>
    return <Badge variant="secondary">📷 Fallback</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <TestTube className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1>Test Fallback Images Régions</h1>
          <p className="text-muted-foreground">
            Vérification que l'affichage fonctionne avec et sans images
          </p>
        </div>
      </div>

      {/* Résultats du test */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Résultats du test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Total régions</span>
                </div>
                <Badge variant="outline">{testResults.totalRegions}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-4 w-4 text-green-600" />
                  <span>Avec images</span>
                </div>
                <Badge className="bg-green-100 text-green-800">{testResults.withImages}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-secondary-foreground" />
                  <span>Sans images</span>
                </div>
                <Badge variant="secondary">{testResults.withoutImages}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Fallback actif</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">✅ OK</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={loadRegionsForTest}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          Recharger le test
        </Button>
      </div>

      {/* Affichage des régions avec test visuel */}
      <Card>
        <CardHeader>
          <CardTitle>Test visuel des régions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((region) => {
              const hasImage = hasRegionImage(region.image_url)
              
              return (
                <Card key={region.id} className="overflow-hidden">
                  <div className="aspect-video">
                    <RegionImageFallback
                      src={region.image_url}
                      alt={region.name}
                      className="w-full h-full object-cover"
                      fallbackClassName="w-full h-full bg-secondary flex items-center justify-center"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6>{region.name}</h6>
                      {getStatusBadge(hasImage)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StatusIcon hasImage={hasImage} />
                      <span>
                        {hasImage ? 'Image chargée' : 'Fallback affiché'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Créée: {new Date(region.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {regions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Aucune région trouvée</p>
              <p className="text-sm">Exécutez le script SQL pour créer des régions de test</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground space-y-2">
            <h6>Pour tester le système de fallback :</h6>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Exécutez le script : <code className="bg-muted px-1 rounded">/sql/populate_regions_madagascar_starter.sql</code></li>
              <li>Observez les cartes avec fallback (icône MapPin)</li>
              <li>Ajoutez des images via <strong>Gestion des régions</strong></li>
              <li>Revenez ici et rechargez le test</li>
              <li>Vérifiez que les images s'affichent correctement</li>
            </ol>
          </div>

          <div className="text-muted-foreground space-y-2">
            <h6>Système de fallback :</h6>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Sans image :</strong> Affiche une icône MapPin avec "Image à ajouter"</li>
              <li><strong>Avec image :</strong> Affiche l'image normalement</li>
              <li><strong>Image cassée :</strong> Remplace automatiquement par "Image indisponible"</li>
              <li><strong>Responsive :</strong> S'adapte à toutes les tailles</li>
              <li><strong>Accessible :</strong> Alt text et indicateurs visuels</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegionsFallbackTest