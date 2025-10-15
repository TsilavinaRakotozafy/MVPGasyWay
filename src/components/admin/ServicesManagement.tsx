import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Car, 
  Bed, 
  UtensilsCrossed, 
  UserCheck, 
  TreePine, 
  Shield,
  Package,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface Service {
  id: string
  name: string
  description?: string
  category: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceStats {
  total: number
  active: number
  by_category: Record<string, number>
}

const serviceCategories = [
  { value: 'transport', label: 'Transport', icon: Car, color: 'bg-blue-100 text-blue-800' },
  { value: 'accommodation', label: 'Hébergement', icon: Bed, color: 'bg-purple-100 text-purple-800' },
  { value: 'food', label: 'Restauration', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-800' },
  { value: 'guide', label: 'Guides', icon: UserCheck, color: 'bg-green-100 text-green-800' },
  { value: 'activity', label: 'Activités', icon: TreePine, color: 'bg-teal-100 text-teal-800' },
  { value: 'equipment', label: 'Équipements', icon: Package, color: 'bg-gray-100 text-gray-800' },
  { value: 'insurance', label: 'Assurances', icon: Shield, color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Autres', icon: Package, color: 'bg-yellow-100 text-yellow-800' }
]

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<ServiceStats>({ total: 0, active: 0, by_category: {} })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  
  // États pour le formulaire
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    icon: '',
    is_active: true
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      
      setServices(data || [])
      
      // Calculer les stats
      const total = data?.length || 0
      const active = data?.filter(s => s.is_active).length || 0
      const by_category = data?.reduce((acc, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      setStats({ total, active, by_category })
      
    } catch (error) {
      console.error('Erreur chargement services:', error)
      toast.error('Erreur lors du chargement des services')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'other',
      icon: '',
      is_active: true
    })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du service est requis')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          icon: formData.icon.trim() || null,
          is_active: formData.is_active
        }])
      
      if (error) throw error
      
      toast.success('Service créé avec succès')
      setIsCreateDialogOpen(false)
      resetForm()
      loadServices()
      
    } catch (error: any) {
      console.error('Erreur création service:', error)
      if (error.code === '23505') {
        toast.error('Un service avec ce nom existe déjà')
      } else {
        toast.error('Erreur lors de la création du service')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      icon: service.icon || '',
      is_active: service.is_active
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingService || !formData.name.trim()) {
      toast.error('Le nom du service est requis')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          icon: formData.icon.trim() || null,
          is_active: formData.is_active
        })
        .eq('id', editingService.id)
      
      if (error) throw error
      
      toast.success('Service mis à jour avec succès')
      setIsEditDialogOpen(false)
      setEditingService(null)
      resetForm()
      loadServices()
      
    } catch (error: any) {
      console.error('Erreur mise à jour service:', error)
      if (error.code === '23505') {
        toast.error('Un service avec ce nom existe déjà')
      } else {
        toast.error('Erreur lors de la mise à jour du service')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)
      
      if (error) throw error
      
      toast.success('Service supprimé avec succès')
      loadServices()
      
    } catch (error: any) {
      console.error('Erreur suppression service:', error)
      if (error.code === '23503') {
        toast.error('Impossible de supprimer : ce service est utilisé dans des packs')
      } else {
        toast.error('Erreur lors de la suppression du service')
      }
    }
  }

  const toggleActiveStatus = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)
      
      if (error) throw error
      
      toast.success(`Service ${!service.is_active ? 'activé' : 'désactivé'}`)
      loadServices()
      
    } catch (error) {
      console.error('Erreur changement statut:', error)
      toast.error('Erreur lors du changement de statut')
    }
  }

  const getCategoryConfig = (category: string) => {
    return serviceCategories.find(c => c.value === category) || serviceCategories[serviceCategories.length - 1]
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    const matchesActive = activeFilter === 'all' || 
                         (activeFilter === 'active' && service.is_active) ||
                         (activeFilter === 'inactive' && !service.is_active)
    
    return matchesSearch && matchesCategory && matchesActive
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <OptimizedSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Gestion des services</h1>
          <p className="text-muted-foreground">
            Gérez les services disponibles pour les packs touristiques
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un service</DialogTitle>
              <DialogDescription>
                Créez un nouveau service disponible pour les packs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nom du service <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Transport privé, Guide local..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Décrivez ce service..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="icon">Icône (optionnel)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({...prev, icon: e.target.value}))}
                    placeholder="car, bed, utensils..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                />
                <Label htmlFor="is_active">Service actif</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? <OptimizedSpinner size={16} /> : 'Créer'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}>
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total services</p>
              <p className="text-2xl font-medium">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actifs</p>
              <p className="text-2xl font-medium text-green-600">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Filter className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Catégories</p>
              <p className="text-2xl font-medium">{Object.keys(stats.by_category).length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Search className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Résultats</p>
              <p className="text-2xl font-medium">{filteredServices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {serviceCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Statut</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs seulement</SelectItem>
                  <SelectItem value="inactive">Inactifs seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setActiveFilter('all')
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des services */}
      <div className="grid gap-4">
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg mb-2">Aucun service trouvé</h3>
              <p className="text-muted-foreground text-center">
                Aucun service ne correspond aux critères de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service) => {
            const categoryConfig = getCategoryConfig(service.category)
            
            return (
              <Card key={service.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Icône de catégorie */}
                  <div className="flex-shrink-0">
                    <categoryConfig.icon className="h-8 w-8 text-gray-600" />
                  </div>
                  
                  {/* Informations principales */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{service.name}</h3>
                      <Badge className={categoryConfig.color}>
                        {categoryConfig.label}
                      </Badge>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Créé le {new Date(service.created_at).toLocaleDateString('fr-FR')}</span>
                      {service.icon && <span>Icône: {service.icon}</span>}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleActiveStatus(service)}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog d'édition */}
      {editingService && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le service</DialogTitle>
              <DialogDescription>
                Modifiez les informations de "{editingService.name}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_name">Nom du service <span className="text-red-500">*</span></Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Transport privé, Guide local..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Décrivez ce service..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit_icon">Icône (optionnel)</Label>
                  <Input
                    id="edit_icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({...prev, icon: e.target.value}))}
                    placeholder="car, bed, utensils..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                />
                <Label htmlFor="edit_is_active">Service actif</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? <OptimizedSpinner size={16} /> : 'Mettre à jour'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setEditingService(null)
                resetForm()
              }}>
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}