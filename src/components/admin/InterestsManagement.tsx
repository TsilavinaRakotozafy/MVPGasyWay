import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { FormField, InputField, TextareaField } from '../ui/form-field'
import { ScrollArea } from '../ui/scroll-area'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  Heart,
  Loader2,
  Eye
} from 'lucide-react'
import { mockInterests, interestCategories, type Interest } from '../../utils/interestsData'

export function InterestsManagement() {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    category: 'nature' as 'nature' | 'culture' | 'adventure' | 'relaxation' | 'gastronomy' | 'photography',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    loadInterests()
  }, [])

  const loadInterests = async () => {
    setLoading(true)
    try {
      // Simuler le chargement depuis l'API
      await new Promise(resolve => setTimeout(resolve, 500))
      setInterests(mockInterests)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des centres d\'intérêt')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      category: 'nature',
      status: 'active'
    })
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.description || !formData.icon) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setActionLoading(true)
    try {
      // Simuler la création
      const newInterest: Interest = {
        id: `int-${Date.now()}`,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pack_count: 0
      }

      setInterests(prev => [newInterest, ...prev])
      setIsCreateSheetOpen(false)
      resetForm()
      toast.success('Centre d\'intérêt créé avec succès')
    } catch (error) {
      console.error('Erreur création:', error)
      toast.error('Erreur lors de la création du centre d\'intérêt')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (interest: Interest) => {
    setSelectedInterest(interest)
    setFormData({
      name: interest.name,
      description: interest.description,
      icon: interest.icon,
      category: interest.category,
      status: interest.status
    })
    setIsEditSheetOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedInterest) return

    setActionLoading(true)
    try {
      const updatedInterest: Interest = {
        ...selectedInterest,
        ...formData,
        updated_at: new Date().toISOString()
      }

      setInterests(prev => prev.map(i => i.id === selectedInterest.id ? updatedInterest : i))
      setIsEditSheetOpen(false)
      setSelectedInterest(null)
      resetForm()
      toast.success('Centre d\'intérêt mis à jour avec succès')
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      toast.error('Erreur lors de la mise à jour du centre d\'intérêt')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (interest: Interest) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le centre d'intérêt "${interest.name}" ?`)) {
      return
    }

    setActionLoading(true)
    try {
      setInterests(prev => prev.filter(i => i.id !== interest.id))
      toast.success('Centre d\'intérêt supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression du centre d\'intérêt')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interest.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || interest.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || interest.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getCategoryInfo = (categoryId: string) => {
    return interestCategories.find(cat => cat.id === categoryId) || 
           { name: categoryId, icon: '📋', color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Gestion des Centres d'Intérêt</h1>
          <p className="text-gray-600">Gérez les centres d'intérêt disponibles pour personnaliser l'expérience utilisateur</p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Créer un centre d'intérêt
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {interestCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{interests.length}</div>
            <p className="text-sm text-gray-600">Total centres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{interests.filter(i => i.status === 'active').length}</div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        {interestCategories.map(category => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{interests.filter(i => i.category === category.id).length}</div>
              <p className="text-sm text-gray-600">{category.icon} {category.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grille des centres d'intérêt */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des centres d'intérêt...</p>
        </div>
      ) : filteredInterests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun centre d'intérêt trouvé</h3>
            <p className="text-gray-500 mb-4">Aucun centre d'intérêt ne correspond à vos critères de recherche.</p>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le premier centre d'intérêt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInterests.map((interest) => {
            const categoryInfo = getCategoryInfo(interest.category)
            return (
              <Card key={interest.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* En-tête avec badges */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={getStatusColor(interest.status)} size="sm">
                          {getStatusLabel(interest.status)}
                        </Badge>
                        <Badge className={categoryInfo.color} size="sm">
                          {categoryInfo.icon} {categoryInfo.name}
                        </Badge>
                      </div>
                    </div>

                    {/* Icône et nom */}
                    <div className="text-center">
                      <div className="text-4xl mb-2">{interest.icon}</div>
                      <h3 className="font-medium text-base line-clamp-1">{interest.name}</h3>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3 text-center">
                      {interest.description}
                    </p>

                    {/* Statistiques */}
                    <div className="pt-2 border-t">
                      <div className="flex justify-center items-center text-sm text-gray-500 mb-3">
                        <Eye className="h-4 w-4 mr-1" />
                        {interest.pack_count || 0} pack{(interest.pack_count || 0) > 1 ? 's' : ''} associé{(interest.pack_count || 0) > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(interest)}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(interest)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet de création */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Créer un nouveau centre d'intérêt</SheetTitle>
            <SheetDescription>
              Ajoutez un nouveau centre d'intérêt pour personnaliser l'expérience utilisateur
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" required>Nom du centre d'intérêt</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Faune sauvage"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="icon" required>Icône</Label>
                  <div className="space-y-2 mt-1">
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🦎"
                    />
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '🦎', '🐢', '🦆', '🌿', '🌳', '🌺', '🏔️', '🏖️',
                        '🏛️', '🎭', '📿', '🎪', '🚗', '🚤', '✈️', '🎯',
                        '🍽️', '🍷', '🎵', '🎨', '📸', '🌅', '⭐', '🌊',
                        '🔥', '🌋', '🏕️', '🚶', '🧗', '🏊', '🤿', '🎣'
                      ].map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                          className={`p-2 text-lg rounded border hover:bg-gray-50 transition-colors ${
                            formData.icon === emoji ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                          }`}
                          title={`Sélectionner ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Cliquez sur un emoji ou tapez directement dans le champ
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" required>Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce centre d'intérêt..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interestCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateSheetOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                'Créer le centre d\'intérêt'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet d'édition */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Modifier le centre d'intérêt</SheetTitle>
            <SheetDescription>
              Modifiez les informations du centre d'intérêt
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name" required>Nom du centre d'intérêt</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Faune sauvage"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_icon" required>Icône</Label>
                  <div className="space-y-2 mt-1">
                    <Input
                      id="edit_icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🦎"
                    />
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '🦎', '🐢', '🦆', '🌿', '🌳', '🌺', '🏔️', '🏖️',
                        '🏛️', '🎭', '📿', '🎪', '🚗', '🚤', '✈️', '🎯',
                        '🍽️', '🍷', '🎵', '🎨', '📸', '🌅', '⭐', '🌊',
                        '🔥', '🌋', '🏕️', '🚶', '🧗', '🏊', '🤿', '🎣'
                      ].map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                          className={`p-2 text-lg rounded border hover:bg-gray-50 transition-colors ${
                            formData.icon === emoji ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                          }`}
                          title={`Sélectionner ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Cliquez sur un emoji ou tapez directement dans le champ
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_description" required>Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez ce centre d'intérêt..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interestCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}