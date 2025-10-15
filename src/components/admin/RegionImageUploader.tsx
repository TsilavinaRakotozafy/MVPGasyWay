import React, { useState, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { 
  compressImageToWebP, 
  generateImageFileName, 
  validateImageFile,
  createImagePreview,
  ImageCompressionOptions
} from '../../utils/imageCompression'
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Image as ImageIcon,
  Trash2,
  ExternalLink
} from 'lucide-react'

// Configuration pour les images de régions (qualité optimisée)
const REGION_IMAGE_CONFIG: ImageCompressionOptions = {
  maxWidth: 1200,      // Plus large pour les régions
  maxHeight: 800,      // Ratio paysage optimal
  quality: 0.88,       // Qualité élevée pour les belles photos
  maxSizeKB: 800       // Un peu plus lourd pour la qualité
}

interface RegionImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  bucketName?: string
  disabled?: boolean
}

export function RegionImageUploader({ 
  value, 
  onChange, 
  label = "Image de la région",
  placeholder = "URL de l'image ou télécharger...",
  bucketName = "regions-images",
  disabled = false
}: RegionImageUploaderProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentUrl, setCurrentUrl] = useState(value)

  // Mettre à jour l'URL locale quand la valeur change
  React.useEffect(() => {
    setCurrentUrl(value)
  }, [value])

  // Fonction pour gérer la sélection de fichier
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation du fichier
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setSelectedFile(file)

    try {
      // Créer un aperçu
      const previewUrl = await createImagePreview(file)
      setPreview(previewUrl)
      
      toast.success(`Image "${file.name}" sélectionnée`)
    } catch (error) {
      console.error('Erreur preview:', error)
      toast.error('Erreur lors de la prévisualisation')
    }
  }

  // Fonction pour uploader l'image
  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast.error('Fichier ou utilisateur manquant')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // 1. Compression de l'image
      setUploadProgress(20)
      toast.info('Compression de l\'image...')
      
      const compressedBlob = await compressImageToWebP(selectedFile, REGION_IMAGE_CONFIG)
      
      // 2. Génération du nom de fichier
      setUploadProgress(40)
      const fileName = generateImageFileName(user.id, selectedFile.name)
      
      // 3. Upload vers Supabase Storage
      setUploadProgress(60)
      toast.info('Upload vers Supabase...')
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          upsert: false
        })

      if (error) {
        throw error
      }

      // 4. Récupération de l'URL publique
      setUploadProgress(80)
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      setUploadProgress(100)

      // 5. Mise à jour de l'état
      setCurrentUrl(publicUrl)
      onChange(publicUrl)
      setSelectedFile(null)
      setPreview('')
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success('✅ Image uploadée avec succès!')

    } catch (error: any) {
      console.error('Erreur upload:', error)
      toast.error(`Erreur upload: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Fonction pour supprimer l'image actuelle
  const handleRemoveImage = () => {
    setCurrentUrl('')
    onChange('')
    setSelectedFile(null)
    setPreview('')
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    toast.success('Image supprimée')
  }

  // Fonction pour gérer l'URL manuelle
  const handleUrlChange = (url: string) => {
    setCurrentUrl(url)
    onChange(url)
    setSelectedFile(null)
    setPreview('')
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Input URL manuelle */}
      <div className="space-y-2">
        <Input
          value={currentUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || uploading}
        />
        {currentUrl && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(currentUrl, '_blank')}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Voir l'image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={disabled || uploading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      {/* Upload de fichier */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-secondary-foreground" />
            </div>
            
            <div>
              <h4>Ou télécharger une nouvelle image</h4>
              <p className="text-muted-foreground">
                JPG, PNG ou WebP • Max 10MB • Compression automatique en WebP
              </p>
            </div>

            {/* Input fichier caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || uploading}
            />

            {/* Bouton de sélection */}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choisir un fichier
            </Button>

            {/* Aperçu du fichier sélectionné */}
            {selectedFile && (
              <div className="space-y-4">
                <div className="text-left bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                        <Badge variant="outline">{selectedFile.type}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aperçu de l'image */}
                {preview && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt="Aperçu"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Bouton d'upload */}
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger l'image
                    </>
                  )}
                </Button>

                {/* Barre de progression */}
                {uploading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-muted-foreground">{uploadProgress}% terminé</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration d'upload visible */}
      <div className="text-muted-foreground space-y-1">
        <h6>Configuration d'upload :</h6>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Résolution: {REGION_IMAGE_CONFIG.maxWidth}×{REGION_IMAGE_CONFIG.maxHeight}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Qualité: {Math.round((REGION_IMAGE_CONFIG.quality || 0.88) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Taille max: {REGION_IMAGE_CONFIG.maxSizeKB}KB</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Format: WebP optimisé</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { REGION_IMAGE_CONFIG }
export type { ImageCompressionOptions }