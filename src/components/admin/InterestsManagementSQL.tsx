import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { ScrollArea } from '../ui/scroll-area'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Heart,
  Loader2,
  Eye,
  Users
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface Interest {
  id: string
  name: string
  slug?: string
  description?: string
  icon_url?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at?: string
  user_count?: number // Nombre d'utilisateurs ayant cet intérêt
}

export function InterestsManagementSQL() {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon_url: '',
    status: 'active' as 'active' | 'inactive'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadInterests()
  }, [])

  const loadInterests = async () => {
    setLoading(true)
    try {
      // Récupérer les intérêts avec le nombre d'utilisateurs associés
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select(`
          id,
          name,
          slug,
          description,
          icon_url,
          status,
          created_at,
          updated_at
        `)
        .order('name')

      if (interestsError) throw interestsError

      // Pour chaque intérêt, compter le nombre d'utilisateurs
      const interestsWithCounts = await Promise.all(
        (interestsData || []).map(async (interest) => {
          const { count, error: countError } = await supabase
            .from('user_interests')
            .select('*', { count: 'exact', head: true })
            .eq('interest_id', interest.id)

          if (countError) {
            console.warn(`Erreur comptage pour ${interest.name}:`, countError)
            return { ...interest, user_count: 0 }
          }

          return { ...interest, user_count: count || 0 }
        })
      )

      setInterests(interestsWithCounts)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des centres d\'intérêt')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le libellé est requis'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le libellé doit contenir au moins 2 caractères'
    }

    // Auto-générer le slug si vide
    if (!formData.slug.trim()) {
      setFormData(prev => ({
        ...prev,
        slug: (formData.name || '').toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      }))
    }

    // Vérifier les doublons (sauf pour l'édition du même élément)
    const duplicateExists = interests.some(interest => 
      (interest.name || '').toLowerCase() === (formData.name || '').trim().toLowerCase() &&
      interest.id !== selectedInterest?.id
    )

    if (duplicateExists) {
      newErrors.name = 'Ce centre d\'intérêt existe déjà'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('interests')
        .insert({
          id: crypto.randomUUID(),
          name: formData.name.trim(),
          slug: (formData.slug || '').trim() || (formData.name || '').toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''),
          description: formData.description.trim() || null,
          icon_url: formData.icon_url.trim() || null,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Centre d'intérêt "${formData.name}" créé avec succès`)
      setIsCreateSheetOpen(false)
      resetForm()
      loadInterests()
    } catch (error: any) {
      console.error('Erreur création:', error)
      toast.error(error.message || 'Erreur lors de la création')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (interest: Interest) => {
    setSelectedInterest(interest)
    setFormData({
      name: interest.name,
      slug: interest.slug || '',
      description: interest.description || '',
      icon_url: interest.icon_url || '',
      status: interest.status
    })
    setErrors({})
    setIsEditSheetOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedInterest || !validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('interests')
        .update({
          name: formData.name.trim(),
          slug: (formData.slug || '').trim() || (formData.name || '').toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, ''),
          description: formData.description.trim() || null,
          icon_url: formData.icon_url.trim() || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInterest.id)

      if (error) throw error

      toast.success(`Centre d'intérêt "${formData.name}" mis à jour avec succès`)
      setIsEditSheetOpen(false)
      resetForm()
      loadInterests()
    } catch (error: any) {
      console.error('Erreur mise à jour:', error)
      toast.error(error.message || 'Erreur lors de la mise à jour')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (interest: Interest) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${interest.name}" ?`)) {
      return
    }

    // Vérifier s'il y a des utilisateurs liés
    if (interest.user_count && interest.user_count > 0) {
      if (!confirm(`Ce centre d'intérêt est utilisé par ${interest.user_count} utilisateur(s). La suppression supprimera également ces associations. Continuer ?`)) {
        return
      }
    }

    setActionLoading(true)
    try {
      // Supprimer d'abord les associations dans user_interests
      const { error: deleteAssociationsError } = await supabase
        .from('user_interests')
        .delete()
        .eq('interest_id', interest.id)

      if (deleteAssociationsError) throw deleteAssociationsError

      // Puis supprimer l'intérêt
      const { error: deleteError } = await supabase
        .from('interests')
        .delete()
        .eq('id', interest.id)

      if (deleteError) throw deleteError

      toast.success(`Centre d'intérêt "${interest.name}" supprimé avec succès`)
      loadInterests()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ 
      name: '', 
      slug: '', 
      description: '', 
      icon_url: '', 
      status: 'active' 
    })
    setErrors({})
    setSelectedInterest(null)
  }

  const filteredInterests = interests.filter(interest =>
    interest.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Centres d'Intérêt</h1>
          <p className="text-gray-600">Gérez le catalogue des centres d'intérêt disponibles pour les utilisateurs</p>
        </div>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel intérêt
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un centre d'intérêt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{interests.length}</div>
            <p className="text-sm text-gray-600">Total intérêts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {interests.reduce((sum, interest) => sum + (interest.user_count || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Associations utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {interests.filter(i => (i.user_count || 0) > 0).length}
            </div>
            <p className="text-sm text-gray-600">Intérêts utilisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {interests.filter(i => (i.user_count || 0) === 0).length}
            </div>
            <p className="text-sm text-gray-600">Intérêts non utilisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des intérêts */}
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
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Commencez par créer votre premier centre d\'intérêt.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier intérêt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterests.map((interest) => (
            <Card key={interest.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* En-tête */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{interest.name}</h3>
                    </div>
                    <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
                  </div>

                  {/* Statistiques */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{interest.user_count || 0} utilisateur{(interest.user_count || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Badges de statut */}
                  <div className="flex flex-wrap gap-1">
                    {(interest.user_count || 0) > 0 ? (
                      <Badge variant="default" className="text-xs">Utilisé</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Non utilisé</Badge>
                    )}
                    {(interest.user_count || 0) > 10 && (
                      <Badge variant="outline" className="text-xs">Populaire</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
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
          ))}
        </div>
      )}

      {/* Sheet de création */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="right" className="w-[500px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Créer un nouveau centre d'intérêt</SheetTitle>
            <SheetDescription>
              Ajoutez un nouveau centre d'intérêt pour personnaliser l'expérience utilisateur
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              <div>
                <Label htmlFor="create-name" required>Libellé</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aventure, Gastronomie, Culture..."
                  className="mt-1"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Conseils</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Utilisez des termes clairs et concis</li>
                  <li>• Évitez les doublons</li>
                  <li>• Pensez aux préférences des voyageurs</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateSheetOpen(false)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                'Créer l\'intérêt'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet d'édition */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-[500px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Modifier le centre d'intérêt</SheetTitle>
            <SheetDescription>
              Modifiez les informations du centre d'intérêt
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              <div>
                <Label htmlFor="edit-name" required>Libellé</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aventure, Gastronomie, Culture..."
                  className="mt-1"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {selectedInterest && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Statistiques</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• {selectedInterest.user_count || 0} utilisateur(s) ont cet intérêt</p>
                    <p>• Créé le {new Date(selectedInterest.created_at).toLocaleDateString('fr-FR')}</p>
                    {selectedInterest.updated_at && (
                      <p>• Modifié le {new Date(selectedInterest.updated_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditSheetOpen(false)
                resetForm()
              }}
            >
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