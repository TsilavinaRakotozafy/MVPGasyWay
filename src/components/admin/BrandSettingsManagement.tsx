import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  Upload, 
  Save, 
  RefreshCw, 
  Image as ImageIcon,
  Globe,
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'

interface BrandSetting {
  id: string
  setting_key: string
  setting_value: string
  file_url?: string
  description: string
  is_active: boolean
  updated_at: string
}

export function BrandSettingsManagement() {
  const [settings, setSettings] = useState<BrandSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Charger les paramètres de marque
  const loadBrandSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .order('setting_key')

      if (error) throw error

      setSettings(data || [])
      
      // Initialiser le formData
      const initialData: Record<string, string> = {}
      data?.forEach(setting => {
        initialData[setting.setting_key] = setting.file_url || setting.setting_value || ''
      })
      setFormData(initialData)

    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
      toast.error('Erreur lors du chargement des paramètres de marque')
    } finally {
      setLoading(false)
    }
  }

  // Upload d'un fichier vers Supabase Storage
  const handleFileUpload = async (settingKey: string, file: File) => {
    try {
      setUploading(settingKey)
      
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `brand/${settingKey}-${Date.now()}.${fileExt}`

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      const fileUrl = urlData.publicUrl

      // Mettre à jour dans la base de données
      const { error: updateError } = await supabase
        .from('brand_settings')
        .update({ 
          file_url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (updateError) throw updateError

      // Mettre à jour l'état local
      setFormData(prev => ({ ...prev, [settingKey]: fileUrl }))
      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, file_url: fileUrl, updated_at: new Date().toISOString() }
          : setting
      ))

      toast.success(`Logo ${settingKey} uploadé avec succès !`)

    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error(`Erreur lors de l'upload du logo ${settingKey}`)
    } finally {
      setUploading(null)
    }
  }

  // Sauvegarder un paramètre texte
  const saveSetting = async (settingKey: string) => {
    try {
      setSaving(settingKey)
      
      const newValue = formData[settingKey] || ''
      
      const { error } = await supabase
        .from('brand_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (error) throw error

      // Mettre à jour l'état local
      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: newValue, updated_at: new Date().toISOString() }
          : setting
      ))

      toast.success(`Paramètre ${settingKey} sauvegardé !`)

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error(`Erreur lors de la sauvegarde de ${settingKey}`)
    } finally {
      setSaving(null)
    }
  }

  // Réinitialiser un paramètre
  const resetSetting = async (settingKey: string) => {
    try {
      const { error } = await supabase
        .from('brand_settings')
        .update({ 
          file_url: null,
          setting_value: settingKey.includes('logo') ? 'GasyWay' : '',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)

      if (error) throw error

      await loadBrandSettings()
      toast.success(`Paramètre ${settingKey} réinitialisé !`)

    } catch (error) {
      console.error('Erreur reset:', error)
      toast.error(`Erreur lors de la réinitialisation de ${settingKey}`)
    }
  }

  // Prévisualiser un logo
  const previewSetting = (setting: BrandSetting) => {
    const value = setting.file_url || setting.setting_value
    
    if (setting.setting_key.includes('logo') && value && value.startsWith('http')) {
      return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          <img src={value} alt="Preview" className="h-8 w-auto max-w-32 object-contain" />
          <span className="text-muted-foreground">{value}</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <span>{value}</span>
      </div>
    )
  }

  useEffect(() => {
    loadBrandSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3>Chargement des paramètres de marque...</h3>
          <p className="text-muted-foreground">
            Récupération des logos, favicon et paramètres de personnalisation depuis Supabase
          </p>
          <div className="text-sm text-muted-foreground mt-4">
            Si cette page reste bloquée, vérifiez que la table <code className="bg-muted px-1 rounded">brand_settings</code> existe dans votre base Supabase
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1>Paramètres de marque</h1>
        <p className="text-muted-foreground">
          Gérez les logos, favicon et éléments de marque de votre plateforme GasyWay.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Les modifications sont appliquées immédiatement sur toute la plateforme. 
          Les logos doivent être au format SVG, PNG ou JPG (max 2MB).
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {setting.setting_key.includes('logo') && <ImageIcon className="h-4 w-4" />}
                    {setting.setting_key.includes('favicon') && <Globe className="h-4 w-4" />}
                    {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <CardDescription>{setting.description}</CardDescription>
                </div>
                <Badge variant={setting.is_active ? "default" : "secondary"}>
                  {setting.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Prévisualisation actuelle */}
              <div className="space-y-2">
                <Label>Aperçu actuel :</Label>
                {previewSetting(setting)}
              </div>

              <Separator />

              {/* Upload de fichier pour les logos/favicon */}
              {(setting.setting_key.includes('logo') || setting.setting_key.includes('favicon')) && (
                <div className="space-y-2">
                  <Label htmlFor={`file-${setting.setting_key}`}>
                    Upload nouveau fichier :
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`file-${setting.setting_key}`}
                      type="file"
                      accept=".svg,.png,.jpg,.jpeg,.ico"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('Le fichier doit faire moins de 2MB')
                            return
                          }
                          handleFileUpload(setting.setting_key, file)
                        }
                      }}
                      disabled={uploading === setting.setting_key}
                    />
                    {uploading === setting.setting_key && (
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>
              )}

              {/* Modification texte/URL */}
              <div className="space-y-2">
                <Label htmlFor={`text-${setting.setting_key}`}>
                  Ou saisir URL/texte :
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`text-${setting.setting_key}`}
                    value={formData[setting.setting_key] || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [setting.setting_key]: e.target.value 
                    }))}
                    placeholder={setting.setting_key.includes('logo') ? 'URL ou texte du logo' : 'URL'}
                    disabled={saving === setting.setting_key}
                  />
                  <Button
                    onClick={() => saveSetting(setting.setting_key)}
                    disabled={saving === setting.setting_key}
                    size="sm"
                  >
                    {saving === setting.setting_key ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetSetting(setting.setting_key)}
                >
                  Réinitialiser
                </Button>
                <span className="text-muted-foreground">
                  Mis à jour : {new Date(setting.updated_at).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aperçu en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu de la plateforme
          </CardTitle>
          <CardDescription>
            Voici comment apparaîtront vos logos sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simulation header */}
          <div className="p-4 bg-primary text-primary-foreground rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formData.logo_header?.startsWith('http') ? (
                <img src={formData.logo_header} alt="Logo header" className="h-8 w-auto" />
              ) : (
                <span>{formData.logo_header || 'GasyWay'}</span>
              )}
            </div>
            <div className="flex gap-4">
              <Monitor className="h-4 w-4" />
              <Smartphone className="h-4 w-4" />
            </div>
          </div>

          {/* Simulation footer */}
          <div className="p-4 bg-muted text-muted-foreground rounded flex items-center justify-center">
            {formData.logo_footer?.startsWith('http') ? (
              <img src={formData.logo_footer} alt="Logo footer" className="h-6 w-auto" />
            ) : (
              <span>{formData.logo_footer || 'GasyWay'}</span>
            )}
          </div>

          {/* Info favicon */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Favicon : {formData.favicon_url || '/favicon.ico'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Bouton refresh */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={loadBrandSettings}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
    </div>
  )
}