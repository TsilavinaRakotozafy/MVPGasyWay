import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { toast } from 'sonner@2.0.3'
import { Plus, Edit2, Trash2, Eye, MapPin, Clock, Users, Star, Calendar, Loader2 } from 'lucide-react'

// import { apiClient } from '../../utils/api' // Remplacé par Supabase
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'
import { CreatePackSheetTabbed } from './CreatePackSheetTabbed'
import { EditPackSheet } from './EditPackSheet'

interface Pack {
  id: string
  title: string
  description: string
  short_description?: string
  price: number
  currency: string
  duration_days: number
  max_participants: number
  min_participants: number
  location: string
  category_id: string
  status: 'active' | 'inactive' | 'archived'
  images: string[]
  included_services: string[]
  excluded_services?: string[]
  difficulty_level?: 'easy' | 'medium' | 'hard'
  season_start?: string
  season_end?: string
  cancellation_policy?: string
  created_by: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description?: string
    icon?: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
}

export function PacksManagement() {
  const { user } = useAuth()
  const [packs, setPacks] = useState<Pack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')



  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [packsResult, categoriesResult] = await Promise.all([
        loadPacks(),
        loadCategories()
      ])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadPacks = async () => {
    try {
      const { data, error } = await supabase
        .from('packs')
        .select(`
          *,
          category:pack_categories(
            id,
            name,
            description,
            icon
          ),
          images:pack_images(
            id,
            image_url,
            is_primary,
            display_order
          ),
          services:pack_services(
            id,
            service_name,
            is_included,
            display_order
          ),
          itinerary:pack_itinerary(
            id,
            day_number,
            title,
            description
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transformer les données pour correspondre à l'interface Pack
      const transformedPacks = (data || []).map(pack => ({
        ...pack,
        images: pack.images?.map(img => img.image_url) || [],
        included_services: pack.services?.filter(s => s.is_included).map(s => s.service_name) || [],
        excluded_services: pack.services?.filter(s => !s.is_included).map(s => s.service_name) || []
      }))

      setPacks(transformedPacks)
    } catch (error) {
      console.error('Erreur chargement packs:', error)
      toast.error('Erreur lors du chargement des packs')
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('pack_categories')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
      // Utiliser des catégories par défaut en cas d'erreur
      const fallbackCategories = [
        { id: 'cat-adventure', name: 'Aventure', icon: '🏔️' },
        { id: 'cat-culture', name: 'Culture', icon: '🏛️' },
        { id: 'cat-nature', name: 'Nature', icon: '🌿' },
        { id: 'cat-beach', name: 'Plage', icon: '🏖️' }
      ]
      setCategories(fallbackCategories)
      toast.error('Impossible de charger les catégories. Utilisation des catégories par défaut.')
    }
  }





  const handleEdit = (pack: Pack) => {
    setSelectedPack(pack)
    setIsEditSheetOpen(true)
  }



  const handleDelete = async (pack: Pack) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le pack "${pack.title}" ?`)) {
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('packs')
        .delete()
        .eq('id', pack.id)

      if (error) {
        throw error
      }
      
      loadPacks()
      toast.success('Pack supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression pack:', error)
      toast.error('Erreur lors de la suppression du pack')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pack.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || pack.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || pack.category_id === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(price)
  }

  const getDifficultyLabel = (level?: string) => {
    const labels = {
      easy: 'Facile',
      medium: 'Modéré',
      hard: 'Difficile'
    }
    return labels[level as keyof typeof labels] || 'Non défini'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      archived: 'Archivé'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Vérification d'accès admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Accès réservé aux administrateurs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Gestion des Packs</h1>
          <p className="text-gray-600">Gérez les packs touristiques disponibles sur la plateforme</p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Créer un pack
        </Button>
        <CreatePackSheetTabbed
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={loadPacks}
          categories={categories}
        />
        <EditPackSheet
          isOpen={isEditSheetOpen}
          onClose={() => {
            setIsEditSheetOpen(false)
            setSelectedPack(null)
          }}
          onSuccess={loadPacks}
          categories={categories}
          pack={selectedPack}
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par titre ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{packs.length}</div>
            <p className="text-sm text-gray-600">Total packs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{packs.filter(p => p.status === 'active').length}</div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{packs.filter(p => p.status === 'inactive').length}</div>
            <p className="text-sm text-gray-600">Inactifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Grille des packs */}
      {filteredPacks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Aucun pack ne correspond à vos critères de recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPacks.map((pack) => (
            <Card key={pack.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* En-tête avec badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getStatusColor(pack.status)} className="text-xs">
                        {getStatusLabel(pack.status)}
                      </Badge>
                      {pack.category && (
                        <Badge variant="outline" className="text-xs">
                          {pack.category.icon} {pack.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Titre et description */}
                  <div>
                    <h3 className="font-medium text-base line-clamp-1 mb-1">{pack.title}</h3>
                    {pack.short_description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{pack.short_description}</p>
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{pack.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pack.duration_days}j
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {pack.min_participants}-{pack.max_participants}p
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Difficulté: {getDifficultyLabel(pack.difficulty_level)}
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="pt-2 border-t">
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatPrice(pack.price)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Créé le {new Date(pack.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(pack)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pack)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      disabled={actionLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


    </div>
  )
}