import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { RegionImageUploader } from './RegionImageUploader'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Loader2,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Users,
  Package,
  Heart,
  Calendar,
  ThermometerSun,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { OptimizedSpinner } from '../common/OptimizedSpinner'

interface RegionComplete {
  id: string
  name: string
  description?: string
  short_description?: string
  image_url?: string
  coordinates_lat?: number
  coordinates_lng?: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  slug?: string
  meta_title?: string
  meta_description?: string
  total_packs: number
  total_interests: number
  total_partners: number
  best_season_start?: string
  best_season_end?: string
  climate_info?: string
  access_info?: string
}

export function RegionsManagementSimple() {
  const { user, session } = useAuth()
  const [regions, setRegions] = useState<RegionComplete[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // États pour la gestion des formulaires
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<RegionComplete | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // États pour le tri
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'display_order'>('name_asc')
  const [sortedRegions, setSortedRegions] = useState<RegionComplete[]>([])
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    image_url: '',
    coordinates_lat: '',
    coordinates_lng: '',
    best_season_start: '',
    best_season_end: '',
    climate_info: '',
    access_info: '',
    slug: '',
    meta_title: '',
    meta_description: ''
  })

  // ✅ Vérification d'authentification sécurisée
  useEffect(() => {
    if (!user) {
      setAuthError('Vous devez être connecté pour accéder à cette page')
      setLoading(false)
      return
    }
    
    if (user.role !== 'admin') {
      setAuthError('Vous devez être administrateur pour accéder à cette page')
      setLoading(false)
      return
    }

    if (!session?.access_token) {
      setAuthError('Session invalide, veuillez vous reconnecter')
      setLoading(false)
      return
    }

    setAuthError(null)
    loadRegions()
  }, [user, session])

  const loadRegions = async () => {
    if (!user || user.role !== 'admin') {
      setAuthError('Authentification requise')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setAuthError(null)
      
      console.log('🔄 [Regions] Chargement des régions...')
      
      const { data, error } = await supabase
        .from('regions')
        .select(`
          id,
          name,
          description,
          short_description,
          image_url,
          coordinates_lat,
          coordinates_lng,
          is_active,
          display_order,
          created_at,
          updated_at,
          slug,
          meta_title,
          meta_description,
          total_packs,
          total_interests,
          total_partners,
          best_season_start,
          best_season_end,
          climate_info,
          access_info
        `)
        .order('name', { ascending: true }) // Tri par nom par défaut
      
      if (error) {
        console.error('❌ [Regions] Erreur:', error)
        if (error.message.includes('JWT') || error.message.includes('sub')) {
          setAuthError('Problème d\'authentification, veuillez vous reconnecter')
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setAuthError('La table regions n\'existe pas encore. Veuillez exécuter le script SQL de création.')
        } else {
          toast.error('Erreur: ' + error.message)
        }
        setRegions([])
        return
      }

      console.log('✅ [Regions] Chargement réussi:', data?.length || 0, 'régions')
      setRegions(data || [])
      
      // Appliquer le tri initial
      applySorting(data || [], sortBy)
    } catch (error: any) {
      console.error('❌ [Regions] Erreur critique:', error)
      if (error.message?.includes('JWT') || error.message?.includes('sub')) {
        setAuthError('Problème d\'authentification, veuillez vous reconnecter')
      } else {
        toast.error('Erreur lors du chargement des régions')
      }
      setRegions([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRegionStatus = async (region: RegionComplete) => {
    try {
      console.log('🔄 [Regions] Toggle statut pour:', region.name)
      
      const { error } = await supabase
        .from('regions')
        .update({ 
          is_active: !region.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', region.id)

      if (error) {
        console.error('❌ [Regions] Erreur toggle:', error)
        throw error
      }

      toast.success(`Région ${!region.is_active ? 'activée' : 'désactivée'} avec succès!`)
      loadRegions()
    } catch (error: any) {
      console.error('❌ [Regions] Erreur changement statut:', error)
      toast.error('Erreur lors du changement de statut: ' + error.message)
    }
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      short_description: '',
      image_url: '',
      coordinates_lat: '',
      coordinates_lng: '',
      best_season_start: '',
      best_season_end: '',
      climate_info: '',
      access_info: '',
      slug: '',
      meta_title: '',
      meta_description: ''
    })
  }

  // Ouvrir le formulaire de création
  const openCreateForm = () => {
    resetForm()
    setEditingRegion(null)
    setIsCreateSheetOpen(true)
  }

  // Ouvrir le formulaire d'édition
  const openEditForm = (region: RegionComplete) => {
    setFormData({
      name: region.name || '',
      description: region.description || '',
      short_description: region.short_description || '',
      image_url: region.image_url || '',
      coordinates_lat: region.coordinates_lat?.toString() || '',
      coordinates_lng: region.coordinates_lng?.toString() || '',
      best_season_start: region.best_season_start || '',
      best_season_end: region.best_season_end || '',
      climate_info: region.climate_info || '',
      access_info: region.access_info || '',
      slug: region.slug || '',
      meta_title: region.meta_title || '',
      meta_description: region.meta_description || ''
    })
    setEditingRegion(region)
    setIsEditSheetOpen(true)
  }

  // Créer une nouvelle région
  const createRegion = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom de la région est requis')
      return
    }

    setFormLoading(true)
    try {
      const newRegion = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        image_url: formData.image_url.trim() || null,
        coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
        coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
        best_season_start: formData.best_season_start.trim() || null,
        best_season_end: formData.best_season_end.trim() || null,
        climate_info: formData.climate_info.trim() || null,
        access_info: formData.access_info.trim() || null,
        slug: formData.slug.trim() || null,
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
        display_order: regions.length + 1, // Auto-généré selon position
        is_active: true,
        total_packs: 0,
        total_interests: 0,
        total_partners: 0
      }

      const { error } = await supabase
        .from('regions')
        .insert([newRegion])

      if (error) {
        console.error('❌ [Regions] Erreur création:', error)
        throw error
      }

      toast.success('Région créée avec succès!')
      setIsCreateSheetOpen(false)
      resetForm()
      loadRegions()
    } catch (error: any) {
      console.error('❌ [Regions] Erreur création:', error)
      toast.error('Erreur lors de la création: ' + error.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Mettre à jour une région
  const updateRegion = async () => {
    if (!editingRegion || !formData.name.trim()) {
      toast.error('Le nom de la région est requis')
      return
    }

    setFormLoading(true)
    try {
      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        image_url: formData.image_url.trim() || null,
        coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
        coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
        best_season_start: formData.best_season_start.trim() || null,
        best_season_end: formData.best_season_end.trim() || null,
        climate_info: formData.climate_info.trim() || null,
        access_info: formData.access_info.trim() || null,
        slug: formData.slug.trim() || null,
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
        // display_order conservé tel quel lors de l'édition
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('regions')
        .update(updates)
        .eq('id', editingRegion.id)

      if (error) {
        console.error('❌ [Regions] Erreur mise à jour:', error)
        throw error
      }

      toast.success('Région mise à jour avec succès!')
      setIsEditSheetOpen(false)
      setEditingRegion(null)
      resetForm()
      loadRegions()
    } catch (error: any) {
      console.error('❌ [Regions] Erreur mise à jour:', error)
      toast.error('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Supprimer une région
  const deleteRegion = async (region: RegionComplete) => {
    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', region.id)

      if (error) {
        console.error('❌ [Regions] Erreur suppression:', error)
        throw error
      }

      toast.success('Région supprimée avec succès!')
      loadRegions()
    } catch (error: any) {
      console.error('❌ [Regions] Erreur suppression:', error)
      toast.error('Erreur lors de la suppression: ' + error.message)
    }
  }

  // Fonction de tri
  const applySorting = (regionsData: RegionComplete[], sortType: 'name_asc' | 'name_desc' | 'display_order') => {
    let sorted = [...regionsData]
    
    switch (sortType) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
        break
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' }))
        break
      case 'display_order':
        sorted.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        break
    }
    
    setSortedRegions(sorted)
  }

  // Changer le tri
  const changeSorting = (newSortBy: 'name_asc' | 'name_desc' | 'display_order') => {
    setSortBy(newSortBy)
    applySorting(regions, newSortBy)
  }

  // Mettre à jour le tri quand les régions changent
  useEffect(() => {
    if (regions.length > 0) {
      applySorting(regions, sortBy)
    }
  }, [regions, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <OptimizedSpinner size="lg" message="Chargement des régions..." />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{authError}</h3>
          <p className="text-gray-600 mb-4">
            Veuillez vérifier vos identifiants et réessayer.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Gestion des Régions de Madagascar</h1>
          <p className="text-muted-foreground">
            Supervision des {regions.length} régions touristiques avec {regions.reduce((sum, r) => sum + (r.total_packs || 0), 0)} packs disponibles
          </p>
        </div>
        
        {/* Contrôles de tri */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trier par :</span>
            <div className="flex rounded-md border bg-background">
              <Button
                variant={sortBy === 'name_asc' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeSorting('name_asc')}
                className="rounded-r-none border-r"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                A-Z
              </Button>
              <Button
                variant={sortBy === 'name_desc' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeSorting('name_desc')}
                className="rounded-none border-r"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Z-A
              </Button>
              <Button
                variant={sortBy === 'display_order' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeSorting('display_order')}
                className="rounded-l-none"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Ordre
              </Button>
            </div>
          </div>
          
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openCreateForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle région
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Nouvelle région</SheetTitle>
              <SheetDescription>
                Créer une nouvelle région touristique pour Madagascar
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-default">
              <div className="px-6 py-4 space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <h3>Informations de base</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de la région *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Nord de Madagascar"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="short_description">Description courte</Label>
                      <Textarea
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                        placeholder="Description courte pour les cards..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description complète</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description détaillée de la région..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <RegionImageUploader
                        value={formData.image_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                        label="Image de la région"
                        placeholder="URL de l'image ou télécharger..."
                      />
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className="space-y-4">
                  <h3>Localisation</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coordinates_lat">Latitude</Label>
                      <Input
                        id="coordinates_lat"
                        type="number"
                        step="any"
                        value={formData.coordinates_lat}
                        onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lat: e.target.value }))}
                        placeholder="-18.8792"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coordinates_lng">Longitude</Label>
                      <Input
                        id="coordinates_lng"
                        type="number"
                        step="any"
                        value={formData.coordinates_lng}
                        onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lng: e.target.value }))}
                        placeholder="47.5079"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations saisonnières */}
                <div className="space-y-4">
                  <h3>Saison optimale</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="best_season_start">Début (mois)</Label>
                      <Input
                        id="best_season_start"
                        value={formData.best_season_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, best_season_start: e.target.value }))}
                        placeholder="04"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="best_season_end">Fin (mois)</Label>
                      <Input
                        id="best_season_end"
                        value={formData.best_season_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, best_season_end: e.target.value }))}
                        placeholder="11"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations pratiques */}
                <div className="space-y-4">
                  <h3>Informations pratiques</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="climate_info">Information climatique</Label>
                      <Textarea
                        id="climate_info"
                        value={formData.climate_info}
                        onChange={(e) => setFormData(prev => ({ ...prev, climate_info: e.target.value }))}
                        placeholder="Climat tropical sec. Saison sèche d'avril à novembre..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="access_info">Information d'accès</Label>
                      <Textarea
                        id="access_info"
                        value={formData.access_info}
                        onChange={(e) => setFormData(prev => ({ ...prev, access_info: e.target.value }))}
                        placeholder="Accessible depuis Antananarivo par route (4h30)..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* SEO & Métadonnées */}
                <div className="space-y-4">
                  <h3>SEO & Métadonnées</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug URL</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="nord-madagascar"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_title">Titre SEO</Label>
                      <Input
                        id="meta_title"
                        value={formData.meta_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                        placeholder="Nord de Madagascar - Tsingy d'Ankarana"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_description">Description SEO</Label>
                      <Textarea
                        id="meta_description"
                        value={formData.meta_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                        placeholder="Découvrez les merveilles géologiques du Nord de Madagascar..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-6 border-t bg-background">
              <Button 
                onClick={createRegion} 
                disabled={formLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Créer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateSheetOpen(false)}
                disabled={formLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total régions</p>
                <p className="text-2xl font-semibold">{regions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Régions actives</p>
                <p className="text-2xl font-semibold">
                  {regions.filter(r => r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total packs</p>
                <p className="text-2xl font-semibold">
                  {regions.reduce((sum, r) => sum + (r.total_packs || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total intérêts</p>
                <p className="text-2xl font-semibold">
                  {regions.reduce((sum, r) => sum + (r.total_interests || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des régions */}
      <div className="grid gap-4">
        {sortedRegions.map((region) => (
          <Card key={region.id} className={!region.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{region.name}</h3>
                    <Badge variant={region.is_active ? 'default' : 'secondary'}>
                      {region.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">#{region.display_order}</Badge>
                    {region.slug && (
                      <Badge variant="outline" className="text-xs">
                        /{region.slug}
                      </Badge>
                    )}
                  </div>
                  
                  {region.short_description && (
                    <p className="text-gray-600 mb-2 font-medium">{region.short_description}</p>
                  )}

                  {region.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{region.description}</p>
                  )}

                  {/* Informations de saison et climat */}
                  <div className="flex flex-wrap gap-4 mb-3 text-sm">
                    {region.best_season_start && region.best_season_end && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Calendar className="h-4 w-4" />
                        <span>Saison: {region.best_season_start} → {region.best_season_end}</span>
                      </div>
                    )}
                    
                    {region.coordinates_lat && region.coordinates_lng && (
                      <div className="flex items-center gap-1 text-green-600">
                        <MapPin className="h-4 w-4" />
                        <span>{region.coordinates_lat.toFixed(2)}, {region.coordinates_lng.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Statistiques de la région */}
                  <div className="flex gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{region.total_packs || 0} packs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{region.total_interests || 0} intérêts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{region.total_partners || 0} partenaires</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Créée le {new Date(region.created_at).toLocaleDateString('fr-FR')}
                    {region.updated_at !== region.created_at && (
                      <span> • Modifiée le {new Date(region.updated_at).toLocaleDateString('fr-FR')}</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(region)}
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRegionStatus(region)}
                    title={region.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {region.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la région</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer la région <strong>{region.name}</strong> ?
                          Cette action est irréversible et supprimera toutes les données associées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRegion(region)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Informations détaillées (conditionnelles) */}
              {region.climate_info && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-start gap-2 text-sm">
                    <ThermometerSun className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Climat :</p>
                      <p className="text-gray-600">{region.climate_info}</p>
                    </div>
                  </div>
                </div>
              )}

              {region.access_info && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Accès :</p>
                      <p className="text-gray-600">{region.access_info}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {regions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune région trouvée</h3>
            <p className="text-gray-600 mb-4">
              La table regions semble vide. Veuillez exécuter le script SQL de création des régions.
            </p>
            <Button onClick={loadRegions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sheet d'édition */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Modifier la région</SheetTitle>
            <SheetDescription>
              Modifier les informations de la région {editingRegion?.name}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-default">
            <div className="px-6 py-4 space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3>Informations de base</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">Nom de la région *</Label>
                    <Input
                      id="edit_name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Nord de Madagascar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_short_description">Description courte</Label>
                    <Textarea
                      id="edit_short_description"
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      placeholder="Description courte pour les cards..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_description">Description complète</Label>
                    <Textarea
                      id="edit_description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description détaillée de la région..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <RegionImageUploader
                      value={formData.image_url}
                      onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                      label="Image de la région"
                      placeholder="URL de l'image ou télécharger..."
                    />
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div className="space-y-4">
                <h3>Localisation</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_coordinates_lat">Latitude</Label>
                    <Input
                      id="edit_coordinates_lat"
                      type="number"
                      step="any"
                      value={formData.coordinates_lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lat: e.target.value }))}
                      placeholder="-18.8792"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_coordinates_lng">Longitude</Label>
                    <Input
                      id="edit_coordinates_lng"
                      type="number"
                      step="any"
                      value={formData.coordinates_lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinates_lng: e.target.value }))}
                      placeholder="47.5079"
                    />
                  </div>
                </div>
              </div>

              {/* Informations saisonnières */}
              <div className="space-y-4">
                <h3>Saison optimale</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_best_season_start">Début (mois)</Label>
                    <Input
                      id="edit_best_season_start"
                      value={formData.best_season_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, best_season_start: e.target.value }))}
                      placeholder="04"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_best_season_end">Fin (mois)</Label>
                    <Input
                      id="edit_best_season_end"
                      value={formData.best_season_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, best_season_end: e.target.value }))}
                      placeholder="11"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Informations pratiques */}
              <div className="space-y-4">
                <h3>Informations pratiques</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_climate_info">Information climatique</Label>
                    <Textarea
                      id="edit_climate_info"
                      value={formData.climate_info}
                      onChange={(e) => setFormData(prev => ({ ...prev, climate_info: e.target.value }))}
                      placeholder="Climat tropical sec. Saison sèche d'avril à novembre..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_access_info">Information d'accès</Label>
                    <Textarea
                      id="edit_access_info"
                      value={formData.access_info}
                      onChange={(e) => setFormData(prev => ({ ...prev, access_info: e.target.value }))}
                      placeholder="Accessible depuis Antananarivo par route (4h30)..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* SEO & Métadonnées */}
              <div className="space-y-4">
                <h3>SEO & Métadonnées</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_slug">Slug URL</Label>
                    <Input
                      id="edit_slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="nord-madagascar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_meta_title">Titre SEO</Label>
                    <Input
                      id="edit_meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Nord de Madagascar - Tsingy d'Ankarana"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_meta_description">Description SEO</Label>
                    <Textarea
                      id="edit_meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Découvrez les merveilles géologiques du Nord de Madagascar..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-6 border-t bg-background">
            <Button 
              onClick={updateRegion} 
              disabled={formLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sauvegarder
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditSheetOpen(false)}
              disabled={formLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}