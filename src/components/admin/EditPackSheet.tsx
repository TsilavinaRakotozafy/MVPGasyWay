import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Loader2,
  X,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Info,
  Settings,
  Camera,
  List,
  Calendar,
  CheckCircle,
  XCircle,
  Route,
  Save
} from 'lucide-react'

import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { OptimizedSpinner } from '../common/OptimizedSpinner'
import { InterestMultiSelector } from './InterestMultiSelector'

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
  coordinates_lat?: number
  coordinates_lng?: number
  category_id: string
  status: 'active' | 'inactive' | 'archived'
  difficulty_level?: 'easy' | 'medium' | 'hard'
  season_start?: string
  season_end?: string
  cancellation_policy?: string
  created_by: string
  created_at: string
  updated_at: string
  images?: string[]
  included_services?: string[]
  excluded_services?: string[]
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

interface Service {
  id: string
  name: string
  description?: string
  category: string
  icon?: string
  is_active: boolean
}

interface SelectedService {
  service_id: string
  is_included: boolean
  notes?: string
}

interface ItineraryDay {
  day_number: number
  title: string
  description: string
  activities: string[] // IDs des intérêts sélectionnés
  accommodation: string
  meals_included: string
}

interface EditPackSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
  pack: Pack | null
}

export function EditPackSheet({ isOpen, onClose, onSuccess, categories, pack }: EditPackSheetProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')
  
  // État pour suivre la completion des onglets
  const [tabCompletion, setTabCompletion] = useState({
    basic: false,
    pricing: false,
    location: false,
    services: false,
    itinerary: false,
    media: false
  })
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    price: '',
    currency: 'MGA',
    duration_days: '',
    max_participants: '',
    min_participants: '',
    location: '',
    coordinates_lat: '',
    coordinates_lng: '',
    category_id: '',
    status: 'inactive' as 'active' | 'inactive' | 'archived',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    season_start: '',
    season_end: '',
    cancellation_policy: ''
  })

  // Services disponibles et sélectionnés
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)

  // Itinéraire
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([])

  // Images
  const [images, setImages] = useState<string[]>([''])

  // Vérifier la completion des onglets
  useEffect(() => {
    setTabCompletion({
      basic: !!(formData.title && formData.description),
      pricing: !!(formData.price && formData.duration_days && formData.max_participants && formData.min_participants),
      location: !!formData.location,
      services: true, // Optionnel
      itinerary: true, // Optionnel
      media: true // Optionnel
    })
  }, [formData, selectedServices, itinerary, images])

  useEffect(() => {
    if (isOpen) {
      loadAvailableServices()
      if (pack) {
        loadPackData(pack)
      }
    }
  }, [isOpen, pack])

  const loadAvailableServices = async () => {
    try {
      setServicesLoading(true)
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      
      if (error) throw error
      
      setAvailableServices(data || [])
    } catch (error) {
      console.error('Erreur chargement services:', error)
      toast.error('Erreur lors du chargement des services')
    } finally {
      setServicesLoading(false)
    }
  }

  const loadPackData = async (packData: Pack) => {
    try {
      setLoading(true)

      // Charger les données de base
      setFormData({
        title: packData.title || '',
        description: packData.description || '',
        short_description: packData.short_description || '',
        price: packData.price?.toString() || '',
        currency: packData.currency || 'MGA',
        duration_days: packData.duration_days?.toString() || '',
        max_participants: packData.max_participants?.toString() || '',
        min_participants: packData.min_participants?.toString() || '',
        location: packData.location || '',
        coordinates_lat: packData.coordinates_lat?.toString() || '',
        coordinates_lng: packData.coordinates_lng?.toString() || '',
        category_id: packData.category_id || '',
        status: packData.status || 'inactive',
        difficulty_level: packData.difficulty_level || 'medium',
        season_start: packData.season_start || '',
        season_end: packData.season_end || '',
        cancellation_policy: packData.cancellation_policy || ''
      })

      // Charger les services depuis Supabase
      const { data: servicesData } = await supabase
        .from('pack_services')
        .select('*')
        .eq('pack_id', packData.id)
        .order('display_order')

      if (servicesData) {
        setSelectedServices(servicesData.map(s => ({
          service_id: s.service_id || s.service_name, // Fallback pour rétrocompatibilité
          is_included: s.is_included,
          notes: s.notes || ''
        })))
      }

      // Charger l'itinéraire depuis Supabase
      const { data: itineraryData } = await supabase
        .from('pack_itinerary')
        .select('*')
        .eq('pack_id', packData.id)
        .order('day_number')

      if (itineraryData) {
        setItinerary(itineraryData.map(day => ({
          day_number: day.day_number,
          title: day.title || '',
          description: day.description || '',
          activities: day.activities || [],
          accommodation: day.accommodation || '',
          meals_included: day.meals_included || ''
        })))
      }

      // Charger les images depuis Supabase
      const { data: imagesData } = await supabase
        .from('pack_images')
        .select('*')
        .eq('pack_id', packData.id)
        .order('display_order')

      if (imagesData && imagesData.length > 0) {
        setImages(imagesData.map(img => img.image_url))
      } else {
        setImages([''])
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données du pack:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (service: Service, isIncluded: boolean) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.service_id === service.id)
      if (existing) {
        // Mettre à jour le service existant
        return prev.map(s => 
          s.service_id === service.id 
            ? { ...s, is_included: isIncluded }
            : s
        )
      } else {
        // Ajouter nouveau service
        return [...prev, {
          service_id: service.id,
          is_included: isIncluded,
          notes: ''
        }]
      }
    })
  }

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceId))
  }

  const updateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.service_id === serviceId 
        ? { ...s, notes }
        : s
    ))
  }

  const getServiceById = (serviceId: string) => {
    return availableServices.find(s => s.id === serviceId)
  }

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.service_id === serviceId)
  }

  const getSelectedService = (serviceId: string) => {
    return selectedServices.find(s => s.service_id === serviceId)
  }

  const addItineraryDay = () => {
    const nextDay = itinerary.length + 1
    setItinerary([...itinerary, {
      day_number: nextDay,
      title: '',
      description: '',
      activities: [], // Tableau vide d'IDs d'intérêts
      accommodation: '',
      meals_included: ''
    }])
  }

  const updateItineraryDay = (dayNumber: number, field: keyof ItineraryDay, value: any) => {
    setItinerary(itinerary.map(day => 
      day.day_number === dayNumber 
        ? { ...day, [field]: value }
        : day
    ))
  }

  const removeItineraryDay = (dayNumber: number) => {
    setItinerary(itinerary.filter(day => day.day_number !== dayNumber)
      .map((day, index) => ({ ...day, day_number: index + 1 })))
  }

  const addImageUrl = () => {
    setImages([...images, ''])
  }

  const updateImageUrl = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index] = url
    setImages(newImages)
  }

  const removeImageUrl = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index))
    }
  }

  const canProceedToNextTab = () => {
    switch (currentTab) {
      case 'basic':
        return formData.title && formData.description
      case 'pricing':
        return formData.price && formData.duration_days && formData.max_participants && formData.min_participants
      case 'location':
        return formData.location
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!pack || !user) return

    // Validation finale
    if (!tabCompletion.basic || !tabCompletion.pricing || !tabCompletion.location) {
      toast.error('Veuillez compléter les onglets obligatoires (Informations de base, Tarification, Localisation)')
      return
    }

    setLoading(true)
    try {
      // 1. Mettre à jour le pack principal
      const { error: packError } = await supabase
        .from('packs')
        .update({
          title: formData.title,
          description: formData.description,
          short_description: formData.short_description || null,
          price: parseFloat(formData.price),
          currency: formData.currency,
          duration_days: parseInt(formData.duration_days),
          max_participants: parseInt(formData.max_participants),
          min_participants: parseInt(formData.min_participants),
          location: formData.location,
          coordinates_lat: formData.coordinates_lat ? parseFloat(formData.coordinates_lat) : null,
          coordinates_lng: formData.coordinates_lng ? parseFloat(formData.coordinates_lng) : null,
          category_id: formData.category_id || null,
          status: formData.status,
          difficulty_level: formData.difficulty_level,
          season_start: formData.season_start || null,
          season_end: formData.season_end || null,
          cancellation_policy: formData.cancellation_policy || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pack.id)

      if (packError) throw packError

      // 2. Supprimer et recréer les services
      await supabase.from('pack_services').delete().eq('pack_id', pack.id)
      
      if (selectedServices.length > 0) {
        const serviceInserts = selectedServices.map((selectedService, index) => {
          const service = getServiceById(selectedService.service_id)
          return {
            pack_id: pack.id,
            service_id: selectedService.service_id,
            service_name: service?.name, // Pour rétrocompatibilité
            is_included: selectedService.is_included,
            notes: selectedService.notes || null,
            display_order: index + 1
          }
        })

        const { error: servicesError } = await supabase
          .from('pack_services')
          .insert(serviceInserts)

        if (servicesError) throw servicesError
      }

      // 3. Supprimer et recréer l'itinéraire
      await supabase.from('pack_itinerary').delete().eq('pack_id', pack.id)
      
      if (itinerary.length > 0) {
        const itineraryInserts = itinerary.map(day => ({
          pack_id: pack.id,
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          activities: day.activities.filter(Boolean),
          accommodation: day.accommodation,
          meals_included: day.meals_included
        }))

        const { error: itineraryError } = await supabase
          .from('pack_itinerary')
          .insert(itineraryInserts)

        if (itineraryError) throw itineraryError
      }

      // 4. Supprimer et recréer les images
      await supabase.from('pack_images').delete().eq('pack_id', pack.id)
      
      const validImages = images.filter(url => url.trim())
      if (validImages.length > 0) {
        const imageInserts = validImages.map((url, index) => ({
          pack_id: pack.id,
          image_url: url.trim(),
          alt_text: `${formData.title} - Image ${index + 1}`,
          display_order: index + 1,
          is_primary: index === 0
        }))

        const { error: imagesError } = await supabase
          .from('pack_images')
          .insert(imageInserts)

        if (imagesError) throw imagesError
      }

      toast.success('Pack modifié avec succès!')
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      toast.error('Erreur lors de la modification du pack')
    } finally {
      setLoading(false)
    }
  }

  const TabIndicator = ({ completed, label }: { completed: boolean, label: string }) => (
    <div className="flex items-center gap-2">
      {completed ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={completed ? 'text-green-700' : ''}>{label}</span>
    </div>
  )

  if (!pack) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[800px] p-0 flex flex-col max-h-screen">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Modifier le pack</SheetTitle>
          <SheetDescription>
            Modifiez les informations du pack "{pack.title}"
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b px-6 shrink-0">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic" className="text-xs">
                <Info className="h-4 w-4 mr-1" />
                Base
              </TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs">
                <DollarSign className="h-4 w-4 mr-1" />
                Prix
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs">
                <MapPin className="h-4 w-4 mr-1" />
                Lieu
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs">
                <List className="h-4 w-4 mr-1" />
                Services
              </TabsTrigger>
              <TabsTrigger value="itinerary" className="text-xs">
                <Route className="h-4 w-4 mr-1" />
                Itinéraire
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <Camera className="h-4 w-4 mr-1" />
                Média
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Indicateurs de completion */}
          <div className="px-6 py-2 bg-gray-50 text-xs shrink-0">
            <div className="flex gap-4">
              <TabIndicator completed={tabCompletion.basic} label="Infos" />
              <TabIndicator completed={tabCompletion.pricing} label="Prix" />
              <TabIndicator completed={tabCompletion.location} label="Lieu" />
              <TabIndicator completed={tabCompletion.services} label="Services" />
              <TabIndicator completed={tabCompletion.itinerary} label="Itinéraire" />
              <TabIndicator completed={tabCompletion.media} label="Média" />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
            {/* Onglet 1: Informations de base */}
            <TabsContent value="basic" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-4">
                    <Info className="h-5 w-5" />
                    Informations de base
                    <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre du pack <span className="text-red-500">*</span></Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Safari Andasibe-Mantadia"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="short_description">Description courte</Label>
                      <Textarea
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        placeholder="Résumé accrocheur en une ou deux phrases"
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description détaillée <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description complète du pack, activités, points forts..."
                        rows={5}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category_id">Catégorie</Label>
                        <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="difficulty_level">Difficulté</Label>
                        <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({ ...formData, difficulty_level: value as any })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">🟢 Facile</SelectItem>
                            <SelectItem value="medium">🟡 Modéré</SelectItem>
                            <SelectItem value="hard">🔴 Difficile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Statut de publication</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inactive">🟡 Inactif (brouillon)</SelectItem>
                          <SelectItem value="active">🟢 Actif (publié)</SelectItem>
                          <SelectItem value="archived">⚫ Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet 2: Tarification */}
            <TabsContent value="pricing" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5" />
                    Tarification et participants
                    <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Prix par personne <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="280000"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MGA">MGA (Ariary)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="USD">USD (Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration_days">Durée (jours) <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="duration_days"
                          type="number"
                          value={formData.duration_days}
                          onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                          placeholder="3"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="min_participants">Participants minimum <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="min_participants"
                          type="number"
                          value={formData.min_participants}
                          onChange={(e) => setFormData({ ...formData, min_participants: e.target.value })}
                          placeholder="2"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="max_participants">Participants maximum <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="max_participants"
                          type="number"
                          value={formData.max_participants}
                          onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                          placeholder="8"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="season_start">Début saison</Label>
                      <Input
                        id="season_start"
                        value={formData.season_start}
                        onChange={(e) => setFormData({ ...formData, season_start: e.target.value })}
                        placeholder="04-01"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: MM-DD</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="season_end">Fin saison</Label>
                      <Input
                        id="season_end"
                        value={formData.season_end}
                        onChange={(e) => setFormData({ ...formData, season_end: e.target.value })}
                        placeholder="11-30"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: MM-DD</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cancellation_policy">Politique d'annulation</Label>
                    <Textarea
                      id="cancellation_policy"
                      value={formData.cancellation_policy}
                      onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                      placeholder="Annulation gratuite jusqu'à 7 jours avant..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet 3: Localisation */}
            <TabsContent value="location" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5" />
                    Localisation
                    <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location">Lieu <span className="text-red-500">*</span></Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Andasibe-Mantadia, Madagascar"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="coordinates_lat">Latitude (optionnel)</Label>
                        <Input
                          id="coordinates_lat"
                          type="number"
                          step="any"
                          value={formData.coordinates_lat}
                          onChange={(e) => setFormData({ ...formData, coordinates_lat: e.target.value })}
                          placeholder="-18.9441"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="coordinates_lng">Longitude (optionnel)</Label>
                        <Input
                          id="coordinates_lng"
                          type="number"
                          step="any"
                          value={formData.coordinates_lng}
                          onChange={(e) => setFormData({ ...formData, coordinates_lng: e.target.value })}
                          placeholder="48.4245"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet 4: Services */}
            <TabsContent value="services" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-4">
                    <List className="h-5 w-5" />
                    Services inclus et exclus
                    <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                  </h3>
                  
                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <OptimizedSpinner size="md" message="Chargement des services..." />
                    </div>
                  ) : (
                    <>
                      {/* Sélecteur de service avec dropdown */}
                      {availableServices.length === 0 ? (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-8">
                            <List className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 text-center">
                              Aucun service disponible.<br />
                              Créez d'abord des services dans la gestion des services.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Ajouter un service</CardTitle>
                            <CardDescription>
                              Choisissez un service et indiquez s'il est inclus ou exclu du pack
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="service-select">Service</Label>
                                <Select onValueChange={(serviceId) => {
                                  if (serviceId && !isServiceSelected(serviceId)) {
                                    toggleService(availableServices.find(s => s.id === serviceId)!, true)
                                  }
                                }}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Sélectionner un service..." />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Object.entries(
                                      availableServices.reduce((acc, service) => {
                                        if (!acc[service.category]) acc[service.category] = []
                                        acc[service.category].push(service)
                                        return acc
                                      }, {} as Record<string, Service[]>)
                                    ).map(([category, categoryServices]) => (
                                      <div key={category}>
                                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 capitalize bg-gray-50">
                                          {category}
                                        </div>
                                        {categoryServices.map((service) => (
                                          <SelectItem 
                                            key={service.id} 
                                            value={service.id}
                                            disabled={isServiceSelected(service.id)}
                                            className={isServiceSelected(service.id) ? 'opacity-50' : ''}
                                          >
                                            <div className="flex flex-col">
                                              <span>{service.name}</span>
                                              {service.description && (
                                                <span className="text-xs text-gray-500">{service.description}</span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </div>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Liste des services sélectionnés */}
                      {selectedServices.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Services sélectionnés ({selectedServices.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedServices.map((selectedService) => {
                                const service = getServiceById(selectedService.service_id)
                                if (!service) return null
                                
                                return (
                                  <div key={selectedService.service_id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{service.name}</span>
                                        {service.description && (
                                          <span className="text-sm text-gray-500">- {service.description}</span>
                                        )}
                                        <Badge variant={selectedService.is_included ? 'default' : 'destructive'}>
                                          {selectedService.is_included ? 'Inclus' : 'Exclu'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant={selectedService.is_included ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => toggleService(service, true)}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Inclus
                                        </Button>
                                        
                                        <Button
                                          variant={!selectedService.is_included ? 'destructive' : 'outline'}
                                          size="sm"
                                          onClick={() => toggleService(service, false)}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Exclu
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeService(service.id)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Notes pour le service */}
                                    <div>
                                      <Label htmlFor={`notes-${service.id}`} className="text-sm">
                                        Notes spéciales
                                      </Label>
                                      <Input
                                        id={`notes-${service.id}`}
                                        placeholder="Notes spéciales pour ce service..."
                                        value={selectedService.notes || ''}
                                        onChange={(e) => updateServiceNotes(service.id, e.target.value)}
                                        className="mt-1 text-sm"
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Onglet 5: Itinéraire */}
            <TabsContent value="itinerary" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      Itinéraire jour par jour
                      <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                    </h3>
                    <Button onClick={addItineraryDay} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter jour
                    </Button>
                  </div>
                  
                  {itinerary.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Route className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-center">
                          Aucun itinéraire configuré.<br />
                          Cliquez sur "Ajouter jour" pour commencer.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {itinerary.map((day) => (
                        <Card key={day.day_number}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Jour {day.day_number}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItineraryDay(day.day_number)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Titre de la journée</Label>
                              <Input
                                value={day.title}
                                onChange={(e) => updateItineraryDay(day.day_number, 'title', e.target.value)}
                                placeholder="Arrivée et première découverte"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={day.description}
                                onChange={(e) => updateItineraryDay(day.day_number, 'description', e.target.value)}
                                placeholder="Accueil à l'aéroport et route vers..."
                                rows={2}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label>Activités</Label>
                              <InterestMultiSelector
                                selectedInterests={day.activities}
                                onSelectionChange={(interests) => updateItineraryDay(day.day_number, 'activities', interests)}
                                placeholder="Sélectionner des activités pour cette journée..."
                                className="mt-1"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Hébergement</Label>
                                <Input
                                  value={day.accommodation}
                                  onChange={(e) => updateItineraryDay(day.day_number, 'accommodation', e.target.value)}
                                  placeholder="Hôtel, camping..."
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label>Repas inclus</Label>
                                <Input
                                  value={day.meals_included}
                                  onChange={(e) => updateItineraryDay(day.day_number, 'meals_included', e.target.value)}
                                  placeholder="Petit-déjeuner, Déjeuner"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Onglet 6: Médias */}
            <TabsContent value="media" className="px-6 py-4 mt-0">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Images du pack
                      <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                    </h3>
                    <Button onClick={addImageUrl} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter image
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            value={imageUrl}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                          />
                          {index === 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Image principale (affichée en premier)
                            </p>
                          )}
                        </div>
                        {images.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImageUrl(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {images.length === 1 && !images[0] && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Camera className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-center">
                          Aucune image configurée.<br />
                          Ajoutez des URLs d'images pour illustrer votre pack.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            </ScrollArea>
          </div>

          {/* Footer avec navigation */}
          <div className="border-t px-6 py-4 shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {currentTab !== 'basic' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'pricing', 'location', 'services', 'itinerary', 'media']
                      const currentIndex = tabs.indexOf(currentTab)
                      if (currentIndex > 0) {
                        setCurrentTab(tabs[currentIndex - 1])
                      }
                    }}
                  >
                    ← Précédent
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {currentTab !== 'media' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (canProceedToNextTab()) {
                        const tabs = ['basic', 'pricing', 'location', 'services', 'itinerary', 'media']
                        const currentIndex = tabs.indexOf(currentTab)
                        if (currentIndex < tabs.length - 1) {
                          setCurrentTab(tabs[currentIndex + 1])
                        }
                      } else {
                        toast.error('Veuillez compléter les champs obligatoires avant de continuer')
                      }
                    }}
                    disabled={!canProceedToNextTab()}
                  >
                    Suivant →
                  </Button>
                )}
                
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !tabCompletion.basic || !tabCompletion.pricing || !tabCompletion.location}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}