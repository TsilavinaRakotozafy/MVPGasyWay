import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { MessageCircleQuestion, Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, MoreHorizontal, GripVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { toast } from 'sonner@2.0.3'
import { api, handleApiError } from '../../utils/api'
import { invalidateFAQsCache } from '../../hooks/useFAQs'

interface FAQ {
  id: string
  interest_id: string | null
  question: string
  answer: string
  order_index: number
  is_active: boolean
  faq_type: 'general' | 'interest'
  interest_name?: string
  interest_icon?: string
}

interface Interest {
  id: string
  name_fr: string
  icon: string
}

interface CreateFAQForm {
  interest_id: string
  question: string
  answer: string
  order_index?: number
}

interface FAQStats {
  total_faqs: number
  active_faqs: number
  interests_with_faqs: number
}

export const FAQsManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [stats, setStats] = useState<FAQStats>({ total_faqs: 0, active_faqs: 0, interests_with_faqs: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInterest, setSelectedInterest] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  
  // Formulaires
  const [createForm, setCreateForm] = useState<CreateFAQForm>({
    interest_id: '',
    question: '',
    answer: '',
    order_index: 1
  })
  
  const [editForm, setEditForm] = useState<CreateFAQForm>({
    interest_id: '',
    question: '',
    answer: '',
    order_index: 1
  })

  // Charger les données
  useEffect(() => {
    loadData()
  }, [showInactive])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        loadFAQs(),
        loadInterests(),
        loadStats()
      ])
    } catch (error) {
      console.error('❌ Erreur chargement données:', error)
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadFAQs = async () => {
    try {
      console.log('🔄 Chargement FAQ...')
      const data = await api.authGet<FAQ[]>(`/admin/faqs?include_inactive=${showInactive}`)
      console.log('✅ FAQ chargées:', data?.length || 0)
      setFaqs(data || [])
    } catch (error) {
      console.error('❌ Erreur chargement FAQ:', error)
      throw error
    }
  }

  const loadInterests = async () => {
    try {
      console.log('🔄 Chargement centres d\'intérêt...')
      const data = await api.get<Interest[]>('/interests')
      console.log('✅ Centres d\'intérêt chargés:', data?.length || 0)
      setInterests(data || [])
    } catch (error) {
      console.error('❌ Erreur chargement centres d\'intérêt:', error)
      throw error
    }
  }

  const loadStats = async () => {
    try {
      console.log('🔄 Chargement stats FAQ...')
      // Note: Cette route pourrait ne pas exister encore
      const data = await api.authGet<FAQStats>('/admin/faqs/stats')
      console.log('✅ Stats FAQ chargées:', data)
      setStats(data || { total_faqs: 0, active_faqs: 0, interests_with_faqs: 0 })
    } catch (error) {
      console.warn('⚠️ Erreur chargement stats FAQ (non critique):', error)
      // Ne pas throw ici car les stats ne sont pas critiques
    }
  }

  const handleCreateFAQ = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createForm.question.trim() || !createForm.answer.trim() || !createForm.interest_id) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      console.log('🔄 Création FAQ...')
      const newFaq = await api.authPost<FAQ>('/admin/faqs', createForm)
      
      setFaqs(prev => [newFaq, ...prev])
      
      setCreateForm({ interest_id: '', question: '', answer: '', order_index: 1 })
      setIsCreateModalOpen(false)
      
      // ✅ Invalider le cache des FAQ générales si c'est une FAQ générale
      if (newFaq.faq_type === 'general') {
        invalidateFAQsCache()
      }
      
      toast.success('FAQ créée avec succès')
      await loadStats() // Recharger les stats
    } catch (error) {
      console.error('❌ Erreur création FAQ:', error)
      const errorMessage = handleApiError(error)
      toast.error(`Erreur lors de la création: ${errorMessage}`)
    }
  }

  const handleEditFAQ = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingFaq || !editForm.question.trim() || !editForm.answer.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      console.log('🔄 Modification FAQ...')
      const updatedFaq = await api.authPut<FAQ>(`/admin/faqs/${editingFaq.id}`, {
        question: editForm.question,
        answer: editForm.answer,
        order_index: editForm.order_index
      })

      setFaqs(prev => prev.map(faq => faq.id === editingFaq.id ? updatedFaq : faq))
      
      setIsEditModalOpen(false)
      setEditingFaq(null)
      
      // ✅ Invalider le cache des FAQ générales si c'est une FAQ générale
      if (updatedFaq.faq_type === 'general') {
        invalidateFAQsCache()
      }
      
      toast.success('FAQ modifiée avec succès')
    } catch (error) {
      console.error('❌ Erreur modification FAQ:', error)
      const errorMessage = handleApiError(error)
      toast.error(`Erreur lors de la modification: ${errorMessage}`)
    }
  }

  const handleToggleActive = async (faq: FAQ) => {
    try {
      console.log('🔄 Changement statut FAQ...')
      const updatedFaq = await api.authPut<FAQ>(`/admin/faqs/${faq.id}`, { 
        is_active: !faq.is_active 
      })

      setFaqs(prev => prev.map(f => f.id === faq.id ? updatedFaq : f))
      
      // ✅ Invalider le cache des FAQ générales si c'est une FAQ générale
      if (faq.faq_type === 'general') {
        invalidateFAQsCache()
      }
      
      toast.success(`FAQ ${faq.is_active ? 'désactivée' : 'activée'}`)
      await loadStats()
    } catch (error) {
      console.error('❌ Erreur modification statut:', error)
      const errorMessage = handleApiError(error)
      toast.error(`Erreur lors de la modification du statut: ${errorMessage}`)
    }
  }

  const handleDeleteFAQ = async (faq: FAQ) => {
    try {
      console.log('🔄 Suppression FAQ...')
      await api.authDelete(`/admin/faqs/${faq.id}`)

      setFaqs(prev => prev.filter(f => f.id !== faq.id))
      
      // ✅ Invalider le cache des FAQ générales si c'est une FAQ générale
      if (faq.faq_type === 'general') {
        invalidateFAQsCache()
      }
      
      toast.success('FAQ supprimée avec succès')
      await loadStats()
    } catch (error) {
      console.error('❌ Erreur suppression FAQ:', error)
      const errorMessage = handleApiError(error)
      toast.error(`Erreur lors de la suppression: ${errorMessage}`)
    }
  }

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq)
    setEditForm({
      interest_id: faq.interest_id,
      question: faq.question,
      answer: faq.answer,
      order_index: faq.order_index
    })
    setIsEditModalOpen(true)
  }

  // Filtrage des FAQ
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.interest_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesInterest = false
    if (selectedInterest === 'all') {
      matchesInterest = true
    } else if (selectedInterest === 'general') {
      matchesInterest = faq.faq_type === 'general'
    } else {
      matchesInterest = faq.interest_id === selectedInterest
    }
    
    return matchesSearch && matchesInterest
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircleQuestion className="h-8 w-8 animate-pulse text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chargement des FAQ...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total FAQ</p>
                <p className="text-xl font-semibold">{stats.total_faqs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">FAQ Actives</p>
                <p className="text-xl font-semibold">{stats.active_faqs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Centres d'intérêt</p>
                <p className="text-xl font-semibold">{stats.interests_with_faqs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle FAQ
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher dans les FAQ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedInterest} onValueChange={setSelectedInterest}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Centre d'intérêt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les centres d'intérêt</SelectItem>
                <SelectItem value="general">🌟 FAQ Générales GasyWay</SelectItem>
                <Separator className="my-2" />
                {interests.map(interest => (
                  <SelectItem key={interest.id} value={interest.id}>
                    {interest.icon} {interest.name_fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="whitespace-nowrap">
                Inclure inactives
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ ({filteredFaqs.length})</CardTitle>
          <CardDescription>
            Gérez les questions fréquentes par centre d'intérêt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircleQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune FAQ trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedInterest !== 'all' 
                  ? 'Aucune FAQ ne correspond à vos critères de recherche'
                  : 'Commencez par créer votre première FAQ'
                }
              </p>
              {!searchTerm && selectedInterest === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une FAQ
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Centre d'intérêt</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-md">
                      <div>
                        <p className="font-medium truncate">{faq.question}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {faq.answer.substring(0, 100)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {faq.interest_icon} {faq.interest_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={faq.is_active ? 'default' : 'secondary'}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        #{faq.order_index}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditModal(faq)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(faq)}>
                            {faq.is_active ? (
                              <><EyeOff className="h-4 w-4 mr-2" />Désactiver</>
                            ) : (
                              <><Eye className="h-4 w-4 mr-2" />Activer</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. La FAQ sera définitivement supprimée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFAQ(faq)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle FAQ</DialogTitle>
            <DialogDescription>
              Ajoutez une question fréquente pour un centre d'intérêt
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateFAQ} className="space-y-4">
            <div>
              <Label htmlFor="create-interest">Centre d'intérêt *</Label>
              <Select value={createForm.interest_id} onValueChange={(value) => setCreateForm(prev => ({ ...prev, interest_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un centre d'intérêt" />
                </SelectTrigger>
                <SelectContent>
                  {interests.map(interest => (
                    <SelectItem key={interest.id} value={interest.id}>
                      {interest.icon} {interest.name_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="create-question">Question *</Label>
              <Input
                id="create-question"
                value={createForm.question}
                onChange={(e) => setCreateForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Ex: Quel niveau de plongée est requis ?"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="create-answer">Réponse *</Label>
              <Textarea
                id="create-answer"
                value={createForm.answer}
                onChange={(e) => setCreateForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Réponse détaillée à la question..."
                rows={4}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="create-order">Ordre d'affichage</Label>
              <Input
                id="create-order"
                type="number"
                min="1"
                value={createForm.order_index}
                onChange={(e) => setCreateForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Créer la FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la FAQ</DialogTitle>
            <DialogDescription>
              Modifiez la question et la réponse
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditFAQ} className="space-y-4">
            <div>
              <Label>Centre d'intérêt</Label>
              <div className="p-3 bg-muted rounded-md">
                <Badge variant="outline">
                  {editingFaq?.interest_icon} {editingFaq?.interest_name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Le centre d'intérêt ne peut pas être modifié
              </p>
            </div>
            
            <div>
              <Label htmlFor="edit-question">Question *</Label>
              <Input
                id="edit-question"
                value={editForm.question}
                onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-answer">Réponse *</Label>
              <Textarea
                id="edit-answer"
                value={editForm.answer}
                onChange={(e) => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                rows={4}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-order">Ordre d'affichage</Label>
              <Input
                id="edit-order"
                type="number"
                min="1"
                value={editForm.order_index}
                onChange={(e) => setEditForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Sauvegarder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FAQsManagement