import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { safeEquals, safeIncludes, safeSlugify } from '../../utils/safeSearch'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Heart,
  Loader2,
  Eye,
  Users,
  Tag,
  Settings
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface Category {
  id: string
  name: string
}

interface Interest {
  id: string
  name: string
  slug?: string
  description?: string
  icon?: string // Emoji
  icon_url?: string
  active: boolean
  category?: string
  created_at: string
  user_count?: number // Nombre d'utilisateurs ayant cet intérêt
  category_data?: Category
}

interface InterestsManagementSQLCompleteProps {
  user?: {
    id: string
    email: string
    role: 'voyageur' | 'admin'
    [key: string]: any
  }
}

export function InterestsManagementSQLComplete({ user }: InterestsManagementSQLCompleteProps) {
  const [interests, setInterests] = useState<Interest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ✅ Optimisation mémoire : initialisation avec valeur par défaut non vide
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '', // Emoji
    icon_url: '',
    category: 'none', // ✅ Valeur "none" par défaut pour éviter erreur Radix Select
    active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const initializeData = async () => {
      // ✅ Charger d'abord les catégories, puis les intérêts
      await loadCategories()
      await loadInterests()
    }
    
    initializeData()
  }, [])

  const loadInterests = async () => {
    setLoading(true)
    try {
      // ✅ Requête simplifiée sans jointure pour éviter l'erreur SQL
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select(`
          id,
          name,
          slug,
          description,
          icon,
          icon_url,
          active,
          category,
          created_at
        `)
        .order('name')
        .limit(100) // ✅ Limite pour éviter la surcharge mémoire

      if (interestsError) throw interestsError

      // Charger les catégories séparément pour éviter les problèmes de jointure
      let categoriesMap: Record<string, Category> = {}
      if (categories.length > 0) {
        categories.forEach(cat => {
          categoriesMap[cat.id] = cat
        })
      } else {
        // Charger les catégories si pas encore chargées
        const { data: categoriesData } = await supabase
          .from('interest_category')
          .select('id, name, icon')
        
        if (categoriesData) {
          categoriesData.forEach(cat => {
            categoriesMap[cat.id] = cat
          })
        }
      }

      // ✅ Chargement comptage utilisateurs désactivé pour performance en preview
      // const { data: userInterestsData, error: userInterestsError } = await supabase
      //   .from('user_interests')
      //   .select('interest_id')
      const userInterestsData: any[] = [] // ✅ Mock vide pour performance

      // 3. Compter côté client (ultra-rapide en mémoire)
      const countMap: Record<string, number> = {}
      ;(userInterestsData || []).forEach(item => {
        countMap[item.interest_id] = (countMap[item.interest_id] || 0) + 1
      })

      // 4. Fusionner les données avec category_data
      const interestsWithCounts = (interestsData || []).map(interest => ({
        ...interest,
        user_count: countMap[interest.id] || 0,
        category_data: interest.category ? categoriesMap[interest.category] : null
      }))

      setInterests(interestsWithCounts)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des centres d\'intérêt')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      console.log('🔄 Chargement des catégories depuis interest_category...')
      
      // ✅ Vérifier la session utilisateur
      const { data: { session } } = await supabase.auth.getSession()
      console.log('👤 Session utilisateur:', session?.user?.email, 'Role:', user?.role)
      
      // ✅ Requête simple sans colonne icon (inutile pour les catégories)
      const { data: categoriesData, error } = await supabase
        .from('interest_category')
        .select('id, name')
        .order('name')

      console.log('📊 Résultat requête catégories:', { categoriesData, error })
      
      // ✅ Si erreur de permissions
      if (error && error.message?.includes('policy')) {
        console.warn('⚠️ Erreur de politique RLS détectée, vérifiez les permissions sur interest_category')
        setCategoriesError(`Erreur de permissions: ${error.message}. Vérifiez que votre compte admin a accès à la table interest_category.`)
        setCategories([])
        return
      }

      if (error) {
        console.error('❌ Erreur chargement categories:', error)
        setCategoriesError(`Erreur de chargement des catégories: ${error.message}`)
        setCategories([])
        return
      }

      const finalCategories = categoriesData || []
      console.log(`✅ ${finalCategories.length} catégories chargées:`, finalCategories)
      setCategories(finalCategories)
    } catch (error: any) {
      console.error('💥 Erreur lors du chargement des catégories:', error)
      setCategoriesError(`Erreur système: ${error.message || 'Erreur inconnue'}`)
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le libellé est requis'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le libellé doit contenir au moins 2 caractères'
    }

    // Vérifier les doublons (sauf pour l'édition du même élément)
    const duplicateExists = interests.some(interest => 
      safeEquals(interest?.name, formData.name.trim()) &&
      interest.id !== selectedInterest?.id
    )

    if (duplicateExists) {
      newErrors.name = 'Ce centre d\'intérêt existe déjà'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateSlug = (name: string): string => {
    return safeSlugify(name)
  }

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setActionLoading(true)
    try {
      const slug = formData.slug.trim() || generateSlug(formData.name)
      
      // ✅ Validation UUID pour category avant insertion
      let categoryValue = null
      if (formData.category && formData.category !== 'none') {
        // ✅ Vérifier si c'est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (uuidRegex.test(formData.category)) {
          categoryValue = formData.category
        } else {
          console.warn('ID de catégorie invalide (pas un UUID):', formData.category)
          toast.error('ID de catégorie invalide. Veuillez sélectionner une catégorie valide.')
          return
        }
      }

      // Ne pas spécifier l'id, created_at si ils sont auto-générés
      const { data, error } = await supabase
        .from('interests')
        .insert({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          icon: formData.icon.trim() || null,
          icon_url: formData.icon_url.trim() || null,
          category: categoryValue,
          active: formData.active
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
      
      let errorMessage = 'Erreur lors de la création'
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Ce centre d\'intérêt existe déjà'
      } else if (error.message?.includes('null value')) {
        errorMessage = 'Champ requis manquant'
      } else if (error.message?.includes('policy')) {
        errorMessage = 'Problème de permissions - vérifiez que vous êtes admin'
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage = 'Table interests non trouvée - contactez l\'administrateur système'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      console.log('💡 Suggestions de résolution:')
      console.log('1. Vérifiez que la table interests existe')
      console.log('2. Vérifiez vos permissions admin')
      console.log('3. Utilisez le diagnostic de tables pour analyser la structure')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (interest: Interest) => {
    // ✅ Vérifier que les catégories sont chargées avant d'ouvrir l'édition
    if (categoriesLoading) {
      toast.error('Veuillez attendre le chargement des catégories')
      return
    }

    if (categoriesError) {
      toast.error('Impossible d\'éditer : erreur de chargement des catégories')
      return
    }

    setSelectedInterest(interest)
    setFormData({
      name: interest.name,
      slug: interest.slug || '',
      description: interest.description || '',
      icon: interest.icon || '',
      icon_url: interest.icon_url || '',
      category: interest.category || 'none', // ✅ Fallback vers "none" si pas de catégorie
      active: interest.active
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
      const slug = formData.slug.trim() || generateSlug(formData.name)
      
      // ✅ Validation UUID pour category avant mise à jour
      let categoryValue = null
      if (formData.category && formData.category !== 'none') {
        // ✅ Vérifier si c'est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (uuidRegex.test(formData.category)) {
          categoryValue = formData.category
        } else {
          console.warn('ID de catégorie invalide (pas un UUID):', formData.category)
          toast.error('ID de catégorie invalide. Veuillez sélectionner une catégorie valide.')
          return
        }
      }

      const { error } = await supabase
        .from('interests')
        .update({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          icon: formData.icon.trim() || null,
          icon_url: formData.icon_url.trim() || null,
          category: categoryValue,
          active: formData.active
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
      icon: '',
      icon_url: '',
      category: 'none', 
      active: true 
    })
    setErrors({})
    setSelectedInterest(null)
  }

  const createSampleData = async () => {
    setActionLoading(true)
    try {
      // Créer quelques catégories d'exemple
      const categories = [
        { name: 'Nature & Paysages', description: 'Découverte de la nature malgache', icon: '🌿' },
        { name: 'Culture & Traditions', description: 'Immersion dans la culture locale', icon: '🎭' },
        { name: 'Aventure & Sport', description: 'Activités sportives et aventureuses', icon: '🏔️' },
        { name: 'Beach & Détente', description: 'Plages paradisiaques et relaxation', icon: '🏖️' }
      ]

      // Insérer les catégories
      const { data: insertedCategories, error: categoriesError } = await supabase
        .from('interest_category')
        .insert(categories)
        .select()

      if (categoriesError) throw categoriesError

      // Créer quelques centres d'intérêt d'exemple
      const interests = [
        { 
          name: 'Randonnée en montagne', 
          slug: 'randonnee-montagne',
          description: 'Découverte des paysages montagneux',
          icon: '🥾',
          active: true,
          category: insertedCategories[0].id
        },
        { 
          name: 'Baobabs Avenue', 
          slug: 'baobabs-avenue',
          description: 'Visite de la célèbre avenue des baobabs',
          icon: '🌳',
          active: true,
          category: insertedCategories[0].id
        },
        { 
          name: 'Artisanat local', 
          slug: 'artisanat-local',
          description: 'Découverte de l\'artisanat traditionnel',
          icon: '🎨',
          active: true,
          category: insertedCategories[1].id
        },
        { 
          name: 'Plongée sous-marine', 
          slug: 'plongee-sous-marine',
          description: 'Exploration des fonds marins',
          icon: '🤿',
          active: true,
          category: insertedCategories[2].id
        },
        { 
          name: 'Plages de Nosy Be', 
          slug: 'plages-nosy-be',
          description: 'Détente sur les plages paradisiaques',
          icon: '🏝️',
          active: true,
          category: insertedCategories[3].id
        }
      ]

      const { error: interestsError } = await supabase
        .from('interests')
        .insert(interests)

      if (interestsError) throw interestsError

      toast.success('🎉 Données d\'exemple créées avec succès !')
      await loadCategories()
      await loadInterests()
      
    } catch (error: any) {
      console.error('Erreur création données d\'exemple:', error)
      toast.error(`Erreur lors de la création des données: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredInterests = interests.filter(interest =>
    safeIncludes(interest?.name, searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Centres d'Intérêt</h1>
          <p className="text-gray-600">Gérez le catalogue des centres d'intérêt disponibles pour les utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel intérêt
          </Button>
        </div>
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
              {interests.filter(i => i.active === true).length}
            </div>
            <p className="text-sm text-gray-600">Intérêts actifs</p>
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
              {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucun centre d\'intérêt trouvé dans la base de données.'}
            </p>
            {!searchTerm && (
              <div className="space-y-3">
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier intérêt
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={createSampleData}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      '🎯 '
                    )}
                    Créer données d'exemple
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>💡 Problème d'affichage ? Vérifiez :</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• Les tables Supabase existent-elles ?</li>
                    <li>• Les politiques RLS sont-elles correctes ?</li>
                    <li>• Votre compte a-t-il les permissions admin ?</li>
                  </ul>
                  <p className="mt-2">
                    Accédez au <strong>Diagnostic Intérêts</strong> via le menu Système.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredInterests.map((interest) => (
            <Card key={interest.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  {/* Emoji centré */}
                  <div className="flex justify-center">
                    {interest.icon && (
                      <span className="text-4xl">{interest.icon}</span>
                    )}
                    {!interest.icon && interest.icon_url && (
                      <img src={interest.icon_url} alt="" className="w-10 h-10" />
                    )}
                    {!interest.icon && !interest.icon_url && (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Label et description centrés */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-base">{interest.name}</h3>
                    {interest.category_data && (
                      <div className="flex items-center justify-center space-x-1 text-xs text-blue-600">
                        {interest.category_data.icon ? (
                          <span className="text-sm">{interest.category_data.icon}</span>
                        ) : (
                          <Tag className="h-3 w-3" />
                        )}
                        <span>{interest.category_data.name}</span>
                      </div>
                    )}
                    {interest.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{interest.description}</p>
                    )}
                  </div>

                  {/* Informations de base */}
                  <div className="space-y-2 text-xs text-gray-500">
                    {interest.slug && (
                      <p>Slug: {interest.slug}</p>
                    )}
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{interest.user_count || 0} utilisateur{(interest.user_count || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Badges de statut - Mode Admin uniquement */}
                  {user?.role === 'admin' && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {interest.active ? (
                        <Badge variant="default" className="text-xs">Actif</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactif</Badge>
                      )}
                      {(interest.user_count || 0) > 0 ? (
                        <Badge variant="outline" className="text-xs">Utilisé</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">Non utilisé</Badge>
                      )}
                      {(interest.user_count || 0) > 10 && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Populaire</Badge>
                      )}
                    </div>
                  )}

                  {/* Actions - Mode Admin uniquement */}
                  {user?.role === 'admin' && (
                    <div className="flex justify-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(interest)}
                        disabled={actionLoading}
                        className="p-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(interest)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300 p-2"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
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
                <Label htmlFor="create-name">Libellé <span className="text-red-500">*</span></Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aventure, Gastronomie, Culture..."
                  className="mt-1"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="create-slug">Slug (URL)</Label>
                <Input
                  id="create-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="aventure-madagascar (auto-généré si vide)"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Identifiant unique pour les URLs (auto-généré si vide)</p>
              </div>

              <div>
                <Label htmlFor="create-category">Catégorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span>{category.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoriesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Chargement des catégories...</p>
                )}
                {categoriesError && (
                  <p className="text-xs text-red-500 mt-1">{categoriesError}</p>
                )}
                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">Aucune catégorie disponible. Créez-en une d'abord.</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Découvrez des expériences palpitantes..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="create-icon-emoji">Icône (Emoji)</Label>
                <Input
                  id="create-icon-emoji"
                  value={formData.icon}
                  onChange={(e) => {
                    // Filtrer pour ne garder que les emojis (caractères Unicode supérieurs à U+1F000)
                    const emojiValue = e.target.value.replace(/[^\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                    setFormData({ ...formData, icon: emojiValue })
                  }}
                  placeholder="🏔️ 🏖️ 🎭 🍽️ 📸..."
                  className="mt-1 text-center text-2xl"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Sélectionnez un emoji représentant ce centre d'intérêt</p>
              </div>

              <div>
                <Label htmlFor="create-icon-url">URL de l'icône (optionnel)</Label>
                <Input
                  id="create-icon-url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                  placeholder="https://example.com/icon.png"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">URL alternative si pas d'emoji</p>
              </div>

              <div>
                <Label htmlFor="create-active">Statut</Label>
                <select
                  id="create-active"
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Conseils</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Utilisez des termes clairs et concis</li>
                  <li>• Choisissez un emoji représentatif</li>
                  <li>• Évitez les doublons</li>
                  <li>• Pensez aux préférences des voyageurs</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateSheetOpen(false)}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={actionLoading || !formData.name.trim()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Créer l'intérêt
              </Button>
            </div>
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

              <div>
                <Label htmlFor="edit-slug">Slug (URL)</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="aventure-madagascar (auto-généré si vide)"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Identifiant unique pour les URLs (auto-généré si vide)</p>
              </div>

              <div>
                <Label htmlFor="edit-category">Catégorie</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span>{category.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoriesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Chargement des catégories...</p>
                )}
                {categoriesError && (
                  <p className="text-xs text-red-500 mt-1">{categoriesError}</p>
                )}
                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">Aucune catégorie disponible. Créez-en une d'abord.</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Découvrez des expériences palpitantes..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-icon-emoji">Icône (Emoji)</Label>
                <Input
                  id="edit-icon-emoji"
                  value={formData.icon}
                  onChange={(e) => {
                    // Filtrer pour ne garder que les emojis (caractères Unicode supérieurs à U+1F000)
                    const emojiValue = e.target.value.replace(/[^\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                    setFormData({ ...formData, icon: emojiValue })
                  }}
                  placeholder="🏔️ 🏖️ 🎭 🍽️ 📸..."
                  className="mt-1 text-center text-2xl"
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Sélectionnez un emoji représentant ce centre d'intérêt</p>
              </div>

              <div>
                <Label htmlFor="edit-icon-url">URL de l'icône (optionnel)</Label>
                <Input
                  id="edit-icon-url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                  placeholder="https://example.com/icon.png"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">URL alternative si pas d'emoji</p>
              </div>

              <div>
                <Label htmlFor="edit-active">Statut</Label>
                <select
                  id="edit-active"
                  value={formData.active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Conseils</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Utilisez des termes clairs et concis</li>
                  <li>• Choisissez un emoji représentatif</li>
                  <li>• Évitez les doublons</li>
                  <li>• Pensez aux préférences des voyageurs</li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditSheetOpen(false)}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={actionLoading || !formData.name.trim()}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Mettre à jour
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default InterestsManagementSQLComplete