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
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Building, 
  Users,
  Calendar,
  Loader2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'
import { safeMultiFieldSearch } from '../../utils/safeSearch'

interface Partner {
  id: string
  name: string
  description: string
  contact_person: string
  email: string
  phone: string
  website?: string
  address: string
  city: string
  region: string
  status: 'active' | 'inactive' | 'pending'
  partner_type: 'hotel' | 'transport' | 'guide' | 'restaurant' | 'activity' | 'other'
  rating?: number
  commission_rate: number
  contract_start?: string
  contract_end?: string
  created_at: string
  updated_at: string
  logo_url?: string
  verification_status: 'verified' | 'pending' | 'rejected'
  pack_count?: number
}

export function PartnersManagement() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    region: '',
    status: 'pending' as 'active' | 'inactive' | 'pending',
    partner_type: 'other' as 'hotel' | 'transport' | 'guide' | 'restaurant' | 'activity' | 'other',
    commission_rate: '',
    contract_start: '',
    contract_end: '',
    logo_url: ''
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPartners()
    }
  }, [user])

  const loadPartners = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Ajouter pack_count = 0 pour tous (sera calculé plus tard via une vraie relation)
      const partnersWithPackCount = (data || []).map(partner => ({
        ...partner,
        pack_count: 0 // TODO: Calculer le vrai nombre via une relation avec la table packs
      }))

      setPartners(partnersWithPackCount)
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error)
      toast.error('Erreur lors du chargement des partenaires')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      region: '',
      status: 'pending',
      partner_type: 'other',
      commission_rate: '',
      contract_start: '',
      contract_end: '',
      logo_url: ''
    })
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.contact_person) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            contact_person: formData.contact_person,
            email: formData.email,
            phone: formData.phone,
            website: formData.website || null,
            address: formData.address,
            city: formData.city,
            region: formData.region,
            status: formData.status,
            partner_type: formData.partner_type,
            commission_rate: parseFloat(formData.commission_rate) || 0,
            contract_start: formData.contract_start || null,
            contract_end: formData.contract_end || null,
            logo_url: formData.logo_url || null,
            verification_status: 'pending'
          }
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Ajouter le nouveau partenaire avec pack_count = 0
      const newPartnerWithPackCount = {
        ...data,
        pack_count: 0
      }

      setPartners(prev => [newPartnerWithPackCount, ...prev])
      setIsCreateSheetOpen(false)
      resetForm()
      toast.success('Partenaire créé avec succès')
    } catch (error) {
      console.error('Erreur création partenaire:', error)
      toast.error('Erreur lors de la création du partenaire')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner)
    setFormData({
      name: partner.name,
      description: partner.description,
      contact_person: partner.contact_person,
      email: partner.email,
      phone: partner.phone,
      website: partner.website || '',
      address: partner.address,
      city: partner.city,
      region: partner.region,
      status: partner.status,
      partner_type: partner.partner_type,
      commission_rate: partner.commission_rate.toString(),
      contract_start: partner.contract_start || '',
      contract_end: partner.contract_end || '',
      logo_url: partner.logo_url || ''
    })
    setIsEditSheetOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedPartner) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('partners')
        .update({
          name: formData.name,
          description: formData.description,
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          status: formData.status,
          partner_type: formData.partner_type,
          commission_rate: parseFloat(formData.commission_rate) || 0,
          contract_start: formData.contract_start || null,
          contract_end: formData.contract_end || null,
          logo_url: formData.logo_url || null
        })
        .eq('id', selectedPartner.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Mettre à jour la liste avec les nouvelles données
      const updatedPartnerWithPackCount = {
        ...data,
        pack_count: selectedPartner.pack_count // Conserver le pack_count existant
      }

      setPartners(prev => prev.map(p => p.id === selectedPartner.id ? updatedPartnerWithPackCount : p))
      setIsEditSheetOpen(false)
      setSelectedPartner(null)
      resetForm()
      toast.success('Partenaire mis à jour avec succès')
    } catch (error) {
      console.error('Erreur mise à jour partenaire:', error)
      toast.error('Erreur lors de la mise à jour du partenaire')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le partenaire "${partner.name}" ?`)) {
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partner.id)

      if (error) {
        throw error
      }

      setPartners(prev => prev.filter(p => p.id !== partner.id))
      toast.success('Partenaire supprimé avec succès')
    } catch (error) {
      console.error('Erreur suppression partenaire:', error)
      toast.error('Erreur lors de la suppression du partenaire')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = safeMultiFieldSearch([
      partner.name,
      partner.contact_person,
      partner.city
    ], searchTerm)
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter
    const matchesType = typeFilter === 'all' || partner.partner_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      hotel: 'Hôtel',
      transport: 'Transport',
      guide: 'Guide',
      restaurant: 'Restaurant',
      activity: 'Activité',
      other: 'Autre'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      hotel: '🏨',
      transport: '🚗',
      guide: '🧭',
      restaurant: '🍽️',
      activity: '🎯',
      other: '📋'
    }
    return icons[type as keyof typeof icons] || '📋'
  }

  const getVerificationColor = (status: string) => {
    const colors = {
      verified: 'bg-blue-100 text-blue-800',
      pending: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getVerificationLabel = (status: string) => {
    const labels = {
      verified: 'Vérifié',
      pending: 'En cours',
      rejected: 'Rejeté'
    }
    return labels[status as keyof typeof labels] || status
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
          <h1 className="text-2xl">Gestion des Partenaires</h1>
          <p className="text-gray-600">Gérez vos partenaires touristiques et leurs contrats</p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un partenaire
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom, contact ou ville..."
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
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="hotel">Hôtel</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="guide">Guide</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="activity">Activité</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-sm text-gray-600">Total partenaires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{partners.filter(p => p.status === 'active').length}</div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{partners.filter(p => p.status === 'pending').length}</div>
            <p className="text-sm text-gray-600">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{partners.filter(p => p.verification_status === 'verified').length}</div>
            <p className="text-sm text-gray-600">Vérifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{partners.reduce((sum, p) => sum + (p.pack_count || 0), 0)}</div>
            <p className="text-sm text-gray-600">Packs liés</p>
          </CardContent>
        </Card>
      </div>

      {/* Grille des partenaires */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des partenaires...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun partenaire trouvé</h3>
            <p className="text-gray-500 mb-4">Aucun partenaire ne correspond à vos critères de recherche.</p>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le premier partenaire
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* En-tête avec badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getStatusColor(partner.status)} className="text-xs">
                        {getStatusLabel(partner.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(partner.partner_type)} {getTypeLabel(partner.partner_type)}
                      </Badge>
                      <Badge className={getVerificationColor(partner.verification_status)} className="text-xs">
                        {getVerificationLabel(partner.verification_status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Nom et description */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-base line-clamp-1">{partner.name}</h3>
                      {partner.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{partner.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{partner.description}</p>
                  </div>

                  {/* Informations de contact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{partner.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{partner.city}, {partner.region}</span>
                    </div>
                    {partner.website && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{partner.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Informations commerciales */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium">{partner.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Packs liés:</span>
                      <span className="font-medium">{partner.pack_count || 0}</span>
                    </div>
                    {partner.contract_end && (
                      <div className="text-xs text-gray-500">
                        Contrat jusqu'au {new Date(partner.contract_end).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(partner)}
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
        <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Créer un nouveau partenaire</SheetTitle>
            <SheetDescription>
              Ajoutez un nouveau partenaire à votre réseau touristique
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" required>Nom du partenaire</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Madagascar Safari Lodge"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partner_type">Type de partenaire</Label>
                    <Select value={formData.partner_type} onValueChange={(value) => setFormData({ ...formData, partner_type: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">🏨 Hôtel</SelectItem>
                        <SelectItem value="transport">🚗 Transport</SelectItem>
                        <SelectItem value="guide">🧭 Guide</SelectItem>
                        <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                        <SelectItem value="activity">🎯 Activité</SelectItem>
                        <SelectItem value="other">📋 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez les services et spécialités du partenaire..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations de contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_person" required>Personne de contact</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Jean Rakoto"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" required>Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@partner.mg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" required>Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+261 34 12 345 67"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://website.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="font-medium">Adresse</h3>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Avenue de l'Indépendance"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Antananarivo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Région</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Analamanga"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions commerciales */}
              <div className="space-y-4">
                <h3 className="font-medium">Conditions commerciales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission_rate">Taux de commission (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      placeholder="15"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contract_start">Début contrat</Label>
                    <Input
                      id="contract_start"
                      type="date"
                      value={formData.contract_start}
                      onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract_end">Fin contrat</Label>
                    <Input
                      id="contract_end"
                      type="date"
                      value={formData.contract_end}
                      onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                      className="mt-1"
                    />
                  </div>
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
                'Créer le partenaire'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet d'édition */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Modifier le partenaire</SheetTitle>
            <SheetDescription>
              Modifiez les informations du partenaire
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_name" required>Nom du partenaire</Label>
                    <Input
                      id="edit_name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Madagascar Safari Lodge"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_partner_type">Type de partenaire</Label>
                    <Select value={formData.partner_type} onValueChange={(value) => setFormData({ ...formData, partner_type: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">🏨 Hôtel</SelectItem>
                        <SelectItem value="transport">🚗 Transport</SelectItem>
                        <SelectItem value="guide">🧭 Guide</SelectItem>
                        <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                        <SelectItem value="activity">🎯 Activité</SelectItem>
                        <SelectItem value="other">📋 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez les services et spécialités du partenaire..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations de contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_contact_person" required>Personne de contact</Label>
                    <Input
                      id="edit_contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Jean Rakoto"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email" required>Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@partner.mg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_phone" required>Téléphone</Label>
                    <Input
                      id="edit_phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+261 34 12 345 67"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_website">Site web</Label>
                    <Input
                      id="edit_website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://website.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="font-medium">Adresse</h3>
                <div>
                  <Label htmlFor="edit_address">Adresse</Label>
                  <Input
                    id="edit_address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Avenue de l'Indépendance"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_city">Ville</Label>
                    <Input
                      id="edit_city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Antananarivo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_region">Région</Label>
                    <Input
                      id="edit_region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="Analamanga"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions commerciales */}
              <div className="space-y-4">
                <h3 className="font-medium">Conditions commerciales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_commission_rate">Taux de commission (%)</Label>
                    <Input
                      id="edit_commission_rate"
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      placeholder="15"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_contract_start">Début contrat</Label>
                    <Input
                      id="edit_contract_start"
                      type="date"
                      value={formData.contract_start}
                      onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_contract_end">Fin contrat</Label>
                    <Input
                      id="edit_contract_end"
                      type="date"
                      value={formData.contract_end}
                      onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                      className="mt-1"
                    />
                  </div>
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