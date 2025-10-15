import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { toast } from 'sonner@2.0.3'
import { RegionImageFallback } from '../common/RegionImageFallback'
import { 
  Plus, 
  Loader2,
  X,
  MapPin,
  Edit,
  Trash2,
  Save,
  Users,
  Package,
  Heart,
  Image,
  Globe,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Calendar,
  Info,
  Camera,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { InterestMultiSelector } from './InterestMultiSelector'

interface Region {
  id: string
  name: string
  description?: string
  short_description?: string
  image_url?: string
  coordinates_lat?: number
  coordinates_lng?: number
  is_active: boolean
  display_order: number
  slug?: string
  meta_title?: string
  meta_description?: string
  best_season_start?: string
  best_season_end?: string
  climate_info?: string
  access_info?: string
  total_packs: number
  total_interests: number
  total_partners: number
  created_at: string
  updated_at: string
  created_by_email?: string
}

interface RegionFormData {
  name: string
  description: string
  short_description: string
  image_url: string
  coordinates_lat: string
  coordinates_lng: string
  slug: string
  meta_title: string
  meta_description: string
  best_season_start: string
  best_season_end: string
  climate_info: string
  access_info: string
  is_active: boolean
  display_order: number
}

interface RegionInterest {
  interest_id: string
  is_popular: boolean
  notes?: string
}

export function RegionsManagement() {
  const { user, session } = useAuth()
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Vérifications d'authentification améliorées
  const [authError, setAuthError] = useState<string | null>(null)
  
  // États pour les modals
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  
  // État du formulaire
  const [formData, setFormData] = useState<RegionFormData>({
    name: '',
    description: '',
    short_description: '',
    image_url: '',
    coordinates_lat: '',
    coordinates_lng: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    best_season_start: '',
    best_season_end: '',
    climate_info: '',
    access_info: '',
    is_active: true,
    display_order: 0
  })

  // État pour les intérêts de région
  const [regionInterests, setRegionInterests] = useState<string[]>([])
  const [popularInterests, setPopularInterests] = useState<string[]>([])

  // Filtre et tri
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')

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
    if (!user || user.role !== 'admin' || !session?.access_token) {
      setAuthError('Authentification requise')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setAuthError(null)
      
      // ✅ Requête simple sans vue admin pour éviter les erreurs RLS
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
          slug,
          meta_title,
          meta_description,
          best_season_start,
          best_season_end,
          climate_info,
          access_info,
          total_packs,
          total_interests,
          total_partners,
          created_at,
          updated_at
        `)
        .order('display_order', { ascending: true })
      
      if (error) {
        console.error('❌ [Regions] Erreur chargement:', error)
        if (error.message.includes('JWT')) {
          setAuthError('Token d\'authentification invalide, veuillez vous reconnecter')
        } else {
          toast.error('Erreur lors du chargement des régions: ' + error.message)
        }
        setRegions([])
        return
      }

      setRegions(data || [])
    } catch (error: any) {
      console.error('❌ [Regions] Erreur critique:', error)
      if (error.message?.includes('JWT')) {
        setAuthError('Problème d\'authentification, veuillez vous reconnecter')
      } else {
        toast.error('Erreur lors du chargement des régions')
      }
      setRegions([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      short_description: '',
      image_url: '',
      coordinates_lat: '',
      coordinates_lng: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      best_season_start: '',
      best_season_end: '',
      climate_info: '',
      access_info: '',
      is_active: true,
      display_order: regions.length
    })
    setRegionInterests([])
    setPopularInterests([])
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
      meta_title: formData.meta_title || `${name} | GasyWay`
    })
  }

  const loadRegionInterests = async (regionId: string) => {
    try {
      const { data, error } = await supabase
        .from('region_interests')
        .select('interest_id, is_popular')
        .eq('region_id', regionId)
      
      if (error) throw error
      
      const allInterests = data?.map(ri => ri.interest_id) || []
      const popular = data?.filter(ri => ri.is_popular).map(ri => ri.interest_id) || []
      
      setRegionInterests(allInterests)
      setPopularInterests(popular)
    } catch (error) {
      console.error('Erreur chargement intérêts région:', error)
    }
  }

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Le nom de la région est obligatoire')
      return
    }

    setCreating(true)
    try {
      // 1. Créer la région
      const regionData = {
        name: formData.name,
        description: formData.description || null,
        short_description: formData.short_description || null,
        image_url: formData.image_url || null,
        coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
        coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
        slug: formData.slug || generateSlug(formData.name),
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        best_season_start: formData.best_season_start || null,
        best_season_end: formData.best_season_end || null,
        climate_info: formData.climate_info || null,
        access_info: formData.access_info || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
        created_by: user?.id
      }

      const { data: newRegion, error: regionError } = await supabase
        .from('regions')
        .insert([regionData])
        .select()
        .single()

      if (regionError) throw regionError

      // 2. Ajouter les intérêts
      if (regionInterests.length > 0) {
        const interestInserts = regionInterests.map((interestId, index) => ({
          region_id: newRegion.id,
          interest_id: interestId,
          is_popular: popularInterests.includes(interestId),
          display_order: index
        }))

        const { error: interestsError } = await supabase
          .from('region_interests')
          .insert(interestInserts)

        if (interestsError) throw interestsError
      }

      toast.success('Région créée avec succès!')
      setShowCreateSheet(false)
      resetForm()
      loadRegions()
    } catch (error) {
      console.error('Erreur création région:', error)
      toast.error('Erreur lors de la création de la région')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (region: Region) => {
    setSelectedRegion(region)
    setFormData({
      name: region.name,
      description: region.description || '',
      short_description: region.short_description || '',
      image_url: region.image_url || '',
      coordinates_lat: region.coordinates_lat?.toString() || '',
      coordinates_lng: region.coordinates_lng?.toString() || '',
      slug: region.slug || '',
      meta_title: region.meta_title || '',
      meta_description: region.meta_description || '',
      best_season_start: region.best_season_start || '',
      best_season_end: region.best_season_end || '',
      climate_info: region.climate_info || '',
      access_info: region.access_info || '',
      is_active: region.is_active,
      display_order: region.display_order
    })
    loadRegionInterests(region.id)
    setShowEditSheet(true)
  }

  const handleUpdate = async () => {
    if (!selectedRegion || !formData.name) return

    setUpdating(true)
    try {
      // 1. Mettre à jour la région
      const regionData = {
        name: formData.name,
        description: formData.description || null,
        short_description: formData.short_description || null,
        image_url: formData.image_url || null,
        coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
        coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
        slug: formData.slug || generateSlug(formData.name),
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        best_season_start: formData.best_season_start || null,
        best_season_end: formData.best_season_end || null,
        climate_info: formData.climate_info || null,
        access_info: formData.access_info || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
        updated_at: new Date().toISOString()
      }

      const { error: regionError } = await supabase
        .from('regions')
        .update(regionData)
        .eq('id', selectedRegion.id)

      if (regionError) throw regionError

      // 2. Supprimer et recréer les intérêts
      await supabase
        .from('region_interests')
        .delete()
        .eq('region_id', selectedRegion.id)

      if (regionInterests.length > 0) {
        const interestInserts = regionInterests.map((interestId, index) => ({
          region_id: selectedRegion.id,
          interest_id: interestId,
          is_popular: popularInterests.includes(interestId),
          display_order: index
        }))

        const { error: interestsError } = await supabase
          .from('region_interests')
          .insert(interestInserts)

        if (interestsError) throw interestsError
      }

      toast.success('Région mise à jour avec succès!')
      setShowEditSheet(false)
      setSelectedRegion(null)
      resetForm()
      loadRegions()
    } catch (error) {
      console.error('Erreur mise à jour région:', error)
      toast.error('Erreur lors de la mise à jour de la région')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRegion) return

    setDeleting(selectedRegion.id)
    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', selectedRegion.id)

      if (error) throw error

      toast.success('Région supprimée avec succès!')
      setShowDeleteDialog(false)
      setSelectedRegion(null)
      loadRegions()
    } catch (error) {
      console.error('Erreur suppression région:', error)
      toast.error('Erreur lors de la suppression de la région')
    } finally {
      setDeleting(null)
    }
  }

  const toggleRegionStatus = async (region: Region) => {
    try {
      const { error } = await supabase
        .from('regions')
        .update({ 
          is_active: !region.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', region.id)

      if (error) throw error

      toast.success(`Région ${!region.is_active ? 'activée' : 'désactivée'} avec succès!`)
      loadRegions()
    } catch (error) {
      console.error('Erreur changement statut région:', error)
      toast.error('Erreur lors du changement de statut')
    }
  }

  const moveRegion = async (region: Region, direction: 'up' | 'down') => {
    const sortedRegions = [...regions].sort((a, b) => a.display_order - b.display_order)
    const currentIndex = sortedRegions.findIndex(r => r.id === region.id)
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedRegions.length - 1)
    ) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetRegion = sortedRegions[targetIndex]

    try {
      // Échanger les display_order
      await supabase
        .from('regions')
        .update({ display_order: targetRegion.display_order })
        .eq('id', region.id)

      await supabase
        .from('regions')
        .update({ display_order: region.display_order })
        .eq('id', targetRegion.id)

      loadRegions()
    } catch (error) {
      console.error('Erreur déplacement région:', error)
      toast.error('Erreur lors du déplacement')
    }
  }

  // Filtrer les régions
  const filteredRegions = regions.filter(region => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && region.is_active) ||
      (statusFilter === 'inactive' && !region.is_active)
    
    const matchesSearch = !searchTerm || 
      region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const FormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Tabs defaultValue="basic" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">
          <Info className="h-4 w-4 mr-2" />
          Informations
        </TabsTrigger>
        <TabsTrigger value="location">
          <MapPin className="h-4 w-4 mr-2" />
          Localisation
        </TabsTrigger>
        <TabsTrigger value="interests">
          <Heart className="h-4 w-4 mr-2" />
          Activités
        </TabsTrigger>
        <TabsTrigger value="seo">
          <Globe className="h-4 w-4 mr-2" />
          SEO & Infos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="name">Nom de la région *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Nord de Madagascar"
          />
        </div>

        <div>
          <Label htmlFor="short_description">Description courte</Label>
          <Textarea
            id="short_description"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="Résumé en une phrase pour les cartes"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="description">Description complète</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description détaillée de la région"
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="image_url">Image de la région</Label>
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="display_order">Ordre d'affichage</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              min="0"
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Région active</Label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="location" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="coordinates_lat">Latitude</Label>
            <Input
              id="coordinates_lat"
              type="number"
              step="any"
              value={formData.coordinates_lat}
              onChange={(e) => setFormData({ ...formData, coordinates_lat: e.target.value })}
              placeholder="-18.8792"
            />
          </div>

          <div>
            <Label htmlFor="coordinates_lng">Longitude</Label>
            <Input
              id="coordinates_lng"
              type="number"
              step="any"
              value={formData.coordinates_lng}
              onChange={(e) => setFormData({ ...formData, coordinates_lng: e.target.value })}
              placeholder="47.5079"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="best_season_start">Début meilleure saison</Label>
            <Input
              id="best_season_start"
              value={formData.best_season_start}
              onChange={(e) => setFormData({ ...formData, best_season_start: e.target.value })}
              placeholder="04-01 (MM-DD)"
            />
          </div>

          <div>
            <Label htmlFor="best_season_end">Fin meilleure saison</Label>
            <Input
              id="best_season_end"
              value={formData.best_season_end}
              onChange={(e) => setFormData({ ...formData, best_season_end: e.target.value })}
              placeholder="11-30 (MM-DD)"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="climate_info">Informations climatiques</Label>
          <Textarea
            id="climate_info"
            value={formData.climate_info}
            onChange={(e) => setFormData({ ...formData, climate_info: e.target.value })}
            placeholder="Climat, températures, saisons..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="access_info">Informations d'accès</Label>
          <Textarea
            id="access_info"
            value={formData.access_info}
            onChange={(e) => setFormData({ ...formData, access_info: e.target.value })}
            placeholder="Comment s'y rendre, transports..."
            rows={3}
          />
        </div>
      </TabsContent>

      <TabsContent value="interests" className="space-y-4">
        <div>
          <Label>Activités disponibles dans cette région</Label>
          <InterestMultiSelector
            selectedInterests={regionInterests}
            onSelectionChange={setRegionInterests}
            placeholder="Sélectionner les activités disponibles..."
            className="mt-2"
          />
        </div>

        {regionInterests.length > 0 && (
          <div>
            <Label>Activités populaires (mises en avant)</Label>
            <InterestMultiSelector
              selectedInterests={popularInterests}
              onSelectionChange={setPopularInterests}
              placeholder="Choisir parmi les activités sélectionnées..."
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ces activités seront mises en avant sur la page de la région
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <div>
          <Label htmlFor="slug">Slug URL</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="nord-madagascar"
          />
          <p className="text-sm text-gray-500 mt-1">
            URL: /regions/{formData.slug || 'slug-region'}
          </p>
        </div>

        <div>
          <Label htmlFor="meta_title">Titre SEO</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
            placeholder="Nord de Madagascar - Tsingy et Parcs | GasyWay"
          />
        </div>

        <div>
          <Label htmlFor="meta_description">Description SEO</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            placeholder="Explorez le Nord de Madagascar : Tsingy Rouge, Ankarana..."
            rows={3}
          />
        </div>
      </TabsContent>
    </Tabs>
  )

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
          <h1 className="text-2xl">Gestion des Régions</h1>
          <p className="text-gray-600">
            Gérez les régions touristiques de Madagascar
          </p>
        </div>
        <Button onClick={() => setShowCreateSheet(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle région
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une région..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                <SelectItem value="active">Actives uniquement</SelectItem>
                <SelectItem value="inactive">Inactives uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
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
                  {regions.reduce((sum, r) => sum + r.total_packs, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des régions */}
      <div className="grid gap-4">
        {filteredRegions.map((region) => (
          <Card key={region.id} className={!region.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <RegionImageFallback
                    src={region.image_url}
                    alt={region.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    fallbackClassName="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{region.name}</h3>
                      <Badge variant={region.is_active ? 'default' : 'secondary'}>
                        {region.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">#{region.display_order}</Badge>
                    </div>
                    
                    {region.short_description && (
                      <p className="text-gray-600 mb-2">{region.short_description}</p>
                    )}
                    
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {region.total_packs} packs
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {region.total_interests} activités
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {region.total_partners} partenaires
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRegion(region, 'up')}
                    disabled={region.display_order === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRegion(region, 'down')}
                    disabled={region.display_order === regions.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRegionStatus(region)}
                  >
                    {region.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(region)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRegion(region)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRegions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune région trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune région ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première région.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateSheet(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une région
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de création */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Créer une nouvelle région</SheetTitle>
            <SheetDescription>
              Ajoutez une nouvelle région touristique à votre catalogue.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <FormContent />
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowCreateSheet(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Créer la région
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal d'édition */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier la région</SheetTitle>
            <SheetDescription>
              Modifiez les informations de la région "{selectedRegion?.name}".
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <FormContent isEdit />
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowEditSheet(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la région</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la région "{selectedRegion?.name}" ?
              Cette action est irréversible et supprimera également toutes les associations avec les packs, intérêts et partenaires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}