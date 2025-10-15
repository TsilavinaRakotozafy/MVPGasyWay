import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { compressImageToWebP, generateImageFileName, validateImageFile } from '../../utils/imageCompression'
import { Upload, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

export function StorageUploadDiagnostic() {
  const { user } = useAuth()
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const runDiagnostic = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour tester')
      return
    }

    setTesting(true)
    const results: any[] = []

    try {
      // Test 1: Vérifier que le bucket existe
      results.push({ test: 'Vérification du bucket', status: 'running' })
      setTestResults([...results])

      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        results[results.length - 1] = { 
          test: 'Vérification du bucket', 
          status: 'error', 
          message: bucketsError.message 
        }
      } else {
        const profileBucket = buckets.find(b => b.id === 'profile-pictures')
        results[results.length - 1] = { 
          test: 'Vérification du bucket', 
          status: profileBucket ? 'success' : 'error',
          message: profileBucket ? `Bucket trouvé: ${profileBucket.name}` : 'Bucket profile-pictures non trouvé'
        }
      }
      setTestResults([...results])

      // Test 2: Vérifier l'authentification
      results.push({ test: 'Authentification utilisateur', status: 'running' })
      setTestResults([...results])

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        results[results.length - 1] = { 
          test: 'Authentification utilisateur', 
          status: 'error', 
          message: 'Utilisateur non authentifié'
        }
      } else {
        results[results.length - 1] = { 
          test: 'Authentification utilisateur', 
          status: 'success',
          message: `Utilisateur: ${authUser.email} (ID: ${authUser.id})`
        }
      }
      setTestResults([...results])

      // Test 3: Test upload si un fichier est sélectionné
      if (selectedFile) {
        results.push({ test: 'Upload de fichier de test', status: 'running' })
        setTestResults([...results])

        try {
          // Valider le fichier
          const validation = validateImageFile(selectedFile)
          if (!validation.valid) {
            throw new Error(validation.error)
          }

          // Compresser l'image
          const compressedBlob = await compressImageToWebP(selectedFile, {
            maxWidth: 400,
            maxHeight: 400,
            quality: 0.8,
            maxSizeKB: 200
          })

          // Générer le nom de fichier
          const fileName = generateImageFileName(user.id, selectedFile.name)
          
          // Créer le File object
          const compressedFile = new File([compressedBlob], fileName, {
            type: 'image/webp',
          })

          // Tenter l'upload
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, compressedFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            results[results.length - 1] = { 
              test: 'Upload de fichier de test', 
              status: 'error', 
              message: `Erreur upload: ${uploadError.message}`
            }
          } else {
            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(fileName)

            results[results.length - 1] = { 
              test: 'Upload de fichier de test', 
              status: 'success',
              message: `Upload réussi! Fichier: ${fileName}`,
              url: publicUrl
            }

            // Nettoyer - supprimer le fichier de test
            await supabase.storage
              .from('profile-pictures')
              .remove([fileName])
          }
        } catch (error: any) {
          results[results.length - 1] = { 
            test: 'Upload de fichier de test', 
            status: 'error', 
            message: error.message
          }
        }
        setTestResults([...results])
      }

      // Test 4: Vérifier les politiques RLS
      results.push({ test: 'Vérification des politiques RLS', status: 'running' })
      setTestResults([...results])

      const { data: policies, error: policiesError } = await supabase
        .rpc('get_storage_policies')
        .catch(() => ({ data: null, error: 'Fonction get_storage_policies non disponible' }))

      if (policiesError) {
        results[results.length - 1] = { 
          test: 'Vérification des politiques RLS', 
          status: 'warning', 
          message: 'Impossible de vérifier les politiques automatiquement'
        }
      } else {
        results[results.length - 1] = { 
          test: 'Vérification des politiques RLS', 
          status: 'success',
          message: `Politiques détectées: ${policies?.length || 0}`
        }
      }
      setTestResults([...results])

    } catch (error: any) {
      console.error('Erreur diagnostic:', error)
      toast.error(`Erreur diagnostic: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Succès</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours...</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Diagnostic Upload Storage</h1>
        <p className="text-muted-foreground">
          Diagnostiquer et tester l'upload d'images dans Supabase Storage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Test d'Upload de Fichier
          </CardTitle>
          <CardDescription>
            Sélectionnez une image pour tester l'upload complet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-file">Fichier de test (optionnel)</Label>
            <Input
              id="test-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="bg-input-background"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button 
            onClick={runDiagnostic}
            disabled={testing || !user}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Lancer le diagnostic
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du Diagnostic</CardTitle>
            <CardDescription>
              État des tests d'upload et de configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between p-3 rounded-lg border">
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    {result.message && (
                      <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    )}
                    {result.url && (
                      <p className="text-sm text-blue-600 mt-1">
                        URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">
                          {result.url}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions de Correction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Exécuter le script SQL de correction</h3>
            <p className="text-sm text-muted-foreground">
              Allez dans Supabase → SQL Editor et exécutez le script: 
              <code className="bg-muted px-1 rounded">/sql/emergency_fix_profile_pictures_upload.sql</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">2. Vérifier les permissions</h3>
            <p className="text-sm text-muted-foreground">
              Assurez-vous que l'utilisateur connecté existe dans la table <code className="bg-muted px-1 rounded">users</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">3. Format des fichiers</h3>
            <p className="text-sm text-muted-foreground">
              Les fichiers sont uploadés dans le format: <code className="bg-muted px-1 rounded">{user?.id || '{user_id}'}/timestamp-random.webp</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}