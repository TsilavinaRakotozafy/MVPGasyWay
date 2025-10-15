import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Database,
  Shield,
  Upload,
  Eye,
  Settings
} from 'lucide-react'

interface BucketInfo {
  id: string
  name: string
  public: boolean
  created_at: string
}

interface PolicyInfo {
  policyname: string
  cmd: string
  permissive: boolean
}

export function RegionsImagesDiagnostic() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [bucketExists, setBucketExists] = useState<boolean | null>(null)
  const [bucketInfo, setBucketInfo] = useState<BucketInfo | null>(null)
  const [policies, setPolicies] = useState<PolicyInfo[]>([])
  const [uploadTest, setUploadTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  
  // Vérifier l'existence du bucket
  const checkBucket = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Erreur listBuckets:', error)
        setBucketExists(false)
        return
      }

      const regionsBucket = buckets?.find(bucket => bucket.id === 'regions-images')
      
      if (regionsBucket) {
        setBucketExists(true)
        setBucketInfo(regionsBucket)
      } else {
        setBucketExists(false)
      }
    } catch (error) {
      console.error('Erreur check bucket:', error)
      setBucketExists(false)
    }
  }

  // Créer le bucket automatiquement
  const createBucket = async () => {
    try {
      const { data, error } = await supabase.storage.createBucket('regions-images', {
        public: true
      })

      if (error) {
        throw error
      }

      toast.success('✅ Bucket regions-images créé')
      await checkBucket()
    } catch (error: any) {
      console.error('Erreur création bucket:', error)
      toast.error(`Erreur création bucket: ${error.message}`)
    }
  }

  // Tester l'upload
  const testUpload = async () => {
    if (!user) {
      toast.error('Utilisateur non connecté')
      return
    }

    setUploadTest('testing')

    try {
      // Créer un fichier test (image 1x1 pixel en base64)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      const testBlob = new Blob([Uint8Array.from(atob(testImageBase64), c => c.charCodeAt(0))], { type: 'image/png' })
      
      const fileName = `${user.id}/test-${Date.now()}.png`
      
      // Test upload
      const { data, error } = await supabase.storage
        .from('regions-images')
        .upload(fileName, testBlob)

      if (error) {
        throw error
      }

      // Test lecture
      const { data: publicData } = supabase.storage
        .from('regions-images')
        .getPublicUrl(fileName)

      // Test suppression
      await supabase.storage
        .from('regions-images')
        .remove([fileName])

      setUploadTest('success')
      toast.success('✅ Test d\'upload réussi')

    } catch (error: any) {
      console.error('Erreur test upload:', error)
      setUploadTest('error')
      toast.error(`Test d'upload échoué: ${error.message}`)
    }
  }

  // Diagnostiquer au chargement
  useEffect(() => {
    const runDiagnostic = async () => {
      setLoading(true)
      await checkBucket()
      setLoading(false)
    }

    runDiagnostic()
  }, [])

  const DiagnosticIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">En cours...</Badge>
    if (status === true) return <Badge className="bg-green-100 text-green-800 border-green-200">✅ OK</Badge>
    return <Badge variant="destructive">❌ Erreur</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1>Diagnostic Storage Images Régions</h1>
          <p className="text-muted-foreground">
            Vérification et configuration du bucket Supabase pour les images des régions
          </p>
        </div>
      </div>

      {/* État du bucket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            État du bucket regions-images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <DiagnosticIcon status={bucketExists} />
                <span>Bucket existe</span>
              </div>
              {getStatusBadge(bucketExists)}
            </div>

            {bucketInfo && (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4" />
                    <span>Lecture publique</span>
                  </div>
                  {getStatusBadge(bucketInfo.public)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4" />
                    <span>ID du bucket</span>
                  </div>
                  <Badge variant="outline">{bucketInfo.id}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    <span>Date de création</span>
                  </div>
                  <Badge variant="outline">
                    {new Date(bucketInfo.created_at).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={checkBucket}
              disabled={loading}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Vérifier le bucket
            </Button>

            {bucketExists === false && (
              <Button
                onClick={createBucket}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Database className="h-4 w-4 mr-2" />
                Créer le bucket
              </Button>
            )}

            {bucketExists === true && (
              <Button
                onClick={testUpload}
                disabled={uploadTest === 'testing'}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {uploadTest === 'testing' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Tester l'upload
              </Button>
            )}
          </div>

          {/* Résultat du test d'upload */}
          {uploadTest !== 'idle' && (
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                {uploadTest === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadTest === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {uploadTest === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                <span>
                  {uploadTest === 'testing' && 'Test d\'upload en cours...'}
                  {uploadTest === 'success' && 'Test d\'upload réussi ✅'}
                  {uploadTest === 'error' && 'Test d\'upload échoué ❌'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground space-y-2">
            <h6>Si le bucket n'existe pas :</h6>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Cliquez sur "Créer le bucket" ci-dessus</li>
              <li>Ou exécutez le script SQL : <code className="bg-muted px-1 rounded">/sql/create_regions_images_storage_bucket.sql</code></li>
              <li>Vérifiez les politiques RLS dans Supabase Dashboard</li>
            </ol>
          </div>

          <div className="text-muted-foreground space-y-2">
            <h6>Configuration optimale :</h6>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Bucket public :</strong> true (lecture publique des images)</li>
              <li><strong>Upload :</strong> utilisateurs authentifiés uniquement</li>
              <li><strong>Compression :</strong> WebP automatique (1200×800, qualité 88%)</li>
              <li><strong>Taille max :</strong> 800KB après compression</li>
              <li><strong>RLS :</strong> chaque utilisateur peut gérer ses propres images</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegionsImagesDiagnostic