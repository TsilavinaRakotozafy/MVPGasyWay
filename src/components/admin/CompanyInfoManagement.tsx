/**
 * =====================================================
 * PAGE ADMIN : GESTION DES INFORMATIONS DE L'ENTREPRISE
 * =====================================================
 * Permet aux admins de modifier toutes les informations
 * affichées sur la page "À propos"
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';
import { 
  Save, 
  RefreshCw, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Globe,
  Building,
  Clock,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Leaf,
  Handshake,
  Shield,
  Heart,
  Target,
  Users,
  Award,
  Star
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useCompanyInfo, invalidateCompanyInfoCache } from '../../hooks/useCompanyInfo';
import { CompanyValue } from '../../supabase/functions/server/company-info';

export function CompanyInfoManagement() {
  const { data: companyInfo, loading: loadingInfo, refresh } = useCompanyInfo();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Coordonnées
    contact_email: '',
    contact_phone: '',
    address: '',
    
    // Textes de présentation
    hero_title: '',
    hero_description: '',
    mission_title: '',
    mission_description: '',
    vision_title: '',
    vision_description: '',
    commitment_title: '',
    commitment_description: '',
    
    // Réseaux sociaux
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    twitter_url: '',
    whatsapp_number: '',
    
    // Informations légales
    legal_name: '',
    registration_number: '',
    founding_year: 2024,
    legal_form: '',
    
    // Horaires
    business_hours: '',
    timezone: '',
    supported_languages: '',
  });

  const [values, setValues] = useState<CompanyValue[]>([]);

  // Icônes disponibles pour les valeurs
  const availableIcons = [
    { name: 'Leaf', label: 'Feuille (Écologie)' },
    { name: 'Handshake', label: 'Poignée de main (Partenariat)' },
    { name: 'Shield', label: 'Bouclier (Protection)' },
    { name: 'Heart', label: 'Cœur (Humain)' },
    { name: 'Target', label: 'Cible (Objectif)' },
    { name: 'Users', label: 'Utilisateurs (Communauté)' },
    { name: 'Award', label: 'Récompense (Excellence)' },
    { name: 'Star', label: 'Étoile (Qualité)' },
  ];

  // Charger les données dans le formulaire
  useEffect(() => {
    if (companyInfo) {
      setFormData({
        contact_email: companyInfo.contact_email || '',
        contact_phone: companyInfo.contact_phone || '',
        address: companyInfo.address || '',
        hero_title: companyInfo.hero_title || '',
        hero_description: companyInfo.hero_description || '',
        mission_title: companyInfo.mission_title || '',
        mission_description: companyInfo.mission_description || '',
        vision_title: companyInfo.vision_title || '',
        vision_description: companyInfo.vision_description || '',
        commitment_title: companyInfo.commitment_title || '',
        commitment_description: companyInfo.commitment_description || '',
        facebook_url: companyInfo.facebook_url || '',
        instagram_url: companyInfo.instagram_url || '',
        linkedin_url: companyInfo.linkedin_url || '',
        twitter_url: companyInfo.twitter_url || '',
        whatsapp_number: companyInfo.whatsapp_number || '',
        legal_name: companyInfo.legal_name || '',
        registration_number: companyInfo.registration_number || '',
        founding_year: companyInfo.founding_year || 2024,
        legal_form: companyInfo.legal_form || '',
        business_hours: companyInfo.business_hours || '',
        timezone: companyInfo.timezone || '',
        supported_languages: companyInfo.supported_languages?.join(', ') || '',
      });
      
      // Charger les valeurs
      setValues(companyInfo.values || []);
    }
  }, [companyInfo]);

  // Fonctions CRUD pour les valeurs
  const addValue = () => {
    setValues([...values, { icon: 'Star', title: '', description: '' }]);
  };

  const updateValue = (index: number, field: keyof CompanyValue, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    setValues(newValues);
  };

  const deleteValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const moveValue = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === values.length - 1)
    ) {
      return;
    }

    const newValues = [...values];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newValues[index], newValues[targetIndex]] = [newValues[targetIndex], newValues[index]];
    setValues(newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Récupérer l'ID de l'enregistrement actif
      const { data: existing, error: fetchError } = await supabase
        .from('company_info')
        .select('id')
        .eq('is_active', true)
        .single();

      if (fetchError || !existing) {
        toast.error('Erreur : aucune configuration trouvée');
        setSaving(false);
        return;
      }

      // Préparer les données (convertir supported_languages et values)
      const updates = {
        ...formData,
        supported_languages: formData.supported_languages
          .split(',')
          .map(lang => lang.trim())
          .filter(lang => lang.length > 0),
        values: values, // Ajouter les valeurs au payload
      };

      // Mettre à jour
      const { error } = await supabase
        .from('company_info')
        .update(updates)
        .eq('id', existing.id);

      if (error) {
        console.error('Erreur mise à jour:', error);
        toast.error('Erreur lors de la sauvegarde');
        setSaving(false);
        return;
      }

      // Invalider le cache
      invalidateCompanyInfoCache();

      // Recharger les données
      await refresh();

      toast.success('✅ Informations mises à jour avec succès');
      setSaving(false);
    } catch (err) {
      console.error('Exception:', err);
      toast.error('Erreur lors de la sauvegarde');
      setSaving(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1>Informations de l'entreprise</h1>
        <p className="text-muted-foreground">
          Gérer les informations affichées sur la page "À propos" et partout sur le site
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Coordonnées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Coordonnées
            </CardTitle>
            <CardDescription>
              Informations de contact affichées publiquement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de contact</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@gasyway.mg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Téléphone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+261 34 XX XX XX XX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Antananarivo, Madagascar"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Textes de présentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Textes de présentation
            </CardTitle>
            <CardDescription>
              Contenus affichés sur la page "À propos"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hero Section */}
            <div className="space-y-4">
              <h3>Section Hero</h3>
              <div className="space-y-2">
                <Label htmlFor="hero_title">Titre principal</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  placeholder="À propos de GasyWay"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_description">Description</Label>
                <Textarea
                  id="hero_description"
                  value={formData.hero_description}
                  onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                  placeholder="Description courte..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Mission */}
            <div className="space-y-4">
              <h3>Mission</h3>
              <div className="space-y-2">
                <Label htmlFor="mission_title">Titre</Label>
                <Input
                  id="mission_title"
                  value={formData.mission_title}
                  onChange={(e) => setFormData({ ...formData, mission_title: e.target.value })}
                  placeholder="Notre Mission"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_description">Description</Label>
                <Textarea
                  id="mission_description"
                  value={formData.mission_description}
                  onChange={(e) => setFormData({ ...formData, mission_description: e.target.value })}
                  placeholder="Description de la mission..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Vision */}
            <div className="space-y-4">
              <h3>Vision</h3>
              <div className="space-y-2">
                <Label htmlFor="vision_title">Titre</Label>
                <Input
                  id="vision_title"
                  value={formData.vision_title}
                  onChange={(e) => setFormData({ ...formData, vision_title: e.target.value })}
                  placeholder="Notre Vision"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_description">Description</Label>
                <Textarea
                  id="vision_description"
                  value={formData.vision_description}
                  onChange={(e) => setFormData({ ...formData, vision_description: e.target.value })}
                  placeholder="Description de la vision..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Engagement */}
            <div className="space-y-4">
              <h3>Engagement</h3>
              <div className="space-y-2">
                <Label htmlFor="commitment_title">Titre</Label>
                <Input
                  id="commitment_title"
                  value={formData.commitment_title}
                  onChange={(e) => setFormData({ ...formData, commitment_title: e.target.value })}
                  placeholder="Notre Engagement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commitment_description">Description</Label>
                <Textarea
                  id="commitment_description"
                  value={formData.commitment_description}
                  onChange={(e) => setFormData({ ...formData, commitment_description: e.target.value })}
                  placeholder="Description de l'engagement..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Nos Valeurs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3>Nos Valeurs</h3>
                  <p className="text-muted-foreground">
                    Cards affichées sous "Mission & Vision" sur la page À propos
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addValue}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une valeur
                </Button>
              </div>

              {values.length === 0 ? (
                <Card className="p-6 text-center border-dashed">
                  <p className="text-muted-foreground">
                    Aucune valeur définie. Cliquez sur "Ajouter une valeur" pour commencer.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {values.map((value, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        {/* En-tête avec actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <h4>Valeur {index + 1}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveValue(index, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveValue(index, 'down')}
                              disabled={index === values.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteValue(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Champs du formulaire */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icône</Label>
                            <select
                              className="w-full border border-border rounded-md px-3 py-2 bg-background"
                              value={value.icon}
                              onChange={(e) => updateValue(index, 'icon', e.target.value)}
                            >
                              {availableIcons.map((icon) => (
                                <option key={icon.name} value={icon.name}>
                                  {icon.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>Titre</Label>
                            <Input
                              value={value.title}
                              onChange={(e) => updateValue(index, 'title', e.target.value)}
                              placeholder="Ex: Écologie"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={value.description}
                            onChange={(e) => updateValue(index, 'description', e.target.value)}
                            placeholder="Description de la valeur..."
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Réseaux sociaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Réseaux sociaux
            </CardTitle>
            <CardDescription>
              Liens vers les profils de l'entreprise (optionnels)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook</Label>
              <Input
                id="facebook_url"
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/gasyway"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input
                id="instagram_url"
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/gasyway"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/company/gasyway"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter / X</Label>
              <Input
                id="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/gasyway"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp Business</Label>
              <Input
                id="whatsapp_number"
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="+261 34 XX XX XX XX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations légales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Informations légales
            </CardTitle>
            <CardDescription>
              Données administratives de l'entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legal_name">Nom légal</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="GasyWay SARL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Numéro d'immatriculation</Label>
              <Input
                id="registration_number"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="NIF ou SIRET"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="founding_year">Année de création</Label>
              <Input
                id="founding_year"
                type="number"
                value={formData.founding_year}
                onChange={(e) => setFormData({ ...formData, founding_year: parseInt(e.target.value) || 2024 })}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_form">Forme juridique</Label>
              <Input
                id="legal_form"
                value={formData.legal_form}
                onChange={(e) => setFormData({ ...formData, legal_form: e.target.value })}
                placeholder="SARL, SAS, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Horaires et disponibilité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Horaires et disponibilité
            </CardTitle>
            <CardDescription>
              Informations pratiques pour les visiteurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_hours">Horaires d'ouverture</Label>
              <Input
                id="business_hours"
                value={formData.business_hours}
                onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                placeholder="Lundi - Vendredi : 9h00 - 17h00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="GMT+3 (Madagascar)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supported_languages">Langues supportées</Label>
              <Input
                id="supported_languages"
                value={formData.supported_languages}
                onChange={(e) => setFormData({ ...formData, supported_languages: e.target.value })}
                placeholder="Français, Malgache, Anglais (séparées par des virgules)"
              />
              <p className="text-muted-foreground">
                Séparer les langues par des virgules
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => refresh()}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
