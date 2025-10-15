/**
 * ⚖️ GESTION DES PAGES LÉGALES (ADMIN)
 * Interface admin pour gérer les métadonnées des pages légales
 */

import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  FileText, 
  Cookie, 
  Shield, 
  Save, 
  RefreshCw, 
  Calendar,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../utils/supabase/client";

interface LegalPageMetadata {
  id: string;
  title: string;
  last_updated: string;
  version: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function LegalPagesManagement() {
  const [pages, setPages] = useState<LegalPageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LegalPageMetadata>>({});
  const [saving, setSaving] = useState(false);

  // Charger les pages légales
  const loadLegalPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_pages_metadata')
        .select('*')
        .order('id');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Erreur chargement pages légales:', error);
      toast.error('Erreur lors du chargement des pages légales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegalPages();
  }, []);

  // Icône selon le type de page
  const getPageIcon = (pageId: string) => {
    switch (pageId) {
      case 'privacy': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'terms': return <FileText className="h-5 w-5 text-green-500" />;
      case 'cookies': return <Cookie className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  // Nom affiché selon le type
  const getPageDisplayName = (pageId: string) => {
    switch (pageId) {
      case 'privacy': return 'Politique de Confidentialité';
      case 'terms': return 'Conditions d\'Utilisation';
      case 'cookies': return 'Politique des Cookies';
      default: return pageId;
    }
  };

  // Démarrer l'édition
  const startEditing = (page: LegalPageMetadata) => {
    setEditingPage(page.id);
    setEditForm({
      title: page.title,
      version: page.version,
      is_active: page.is_active,
      metadata: page.metadata
    });
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingPage(null);
    setEditForm({});
  };

  // Sauvegarder les modifications
  const saveChanges = async () => {
    if (!editingPage || !editForm.title || !editForm.version) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('legal_pages_metadata')
        .update({
          title: editForm.title,
          version: editForm.version,
          is_active: editForm.is_active,
          last_updated: new Date().toISOString(),
          metadata: editForm.metadata || {}
        })
        .eq('id', editingPage);

      if (error) throw error;

      toast.success('Page légale mise à jour avec succès');
      await loadLegalPages();
      cancelEditing();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Prévisualiser la page
  const previewPage = (pageId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: pageId }));
    toast.success('Page ouverte dans un nouvel onglet');
  };

  // Mettre à jour les métadonnées JSON
  const updateMetadata = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des pages légales...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1>Gestion des Pages Légales</h1>
        <p className="text-muted-foreground">
          Gérez les métadonnées des pages légales (titres, versions, statuts). 
          Le contenu principal est hardcodé pour la sécurité juridique.
        </p>
      </div>

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Système hybride :</strong> Le contenu des pages est hardcodé dans le code source 
          pour la sécurité juridique. Ici vous ne gérez que les métadonnées (titres, versions, statuts).
        </AlertDescription>
      </Alert>

      {/* Liste des pages */}
      <div className="grid gap-6">
        {pages.map((page) => (
          <Card key={page.id} className="p-6">
            {editingPage === page.id ? (
              // Mode édition
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPageIcon(page.id)}
                    <h3>Édition : {getPageDisplayName(page.id)}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={saveChanges}
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Informations de base */}
                  <div className="space-y-4">
                    <h4>Informations générales</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre affiché</Label>
                      <Input
                        id="title"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                        placeholder="Titre de la page"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={editForm.version || ''}
                        onChange={(e) => setEditForm(prev => ({...prev, version: e.target.value}))}
                        placeholder="1.0"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={editForm.is_active || false}
                        onCheckedChange={(checked) => setEditForm(prev => ({...prev, is_active: checked}))}
                      />
                      <Label htmlFor="active">Page active</Label>
                    </div>
                  </div>

                  {/* Métadonnées spécifiques */}
                  <div className="space-y-4">
                    <h4>Métadonnées</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.metadata?.description || ''}
                        onChange={(e) => updateMetadata('description', e.target.value)}
                        placeholder="Description de la page"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email de contact</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={editForm.metadata?.contact_email || ''}
                        onChange={(e) => updateMetadata('contact_email', e.target.value)}
                        placeholder="contact@gasyway.com"
                      />
                    </div>

                    {page.id === 'terms' && (
                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Juridiction</Label>
                        <Input
                          id="jurisdiction"
                          value={editForm.metadata?.jurisdiction || ''}
                          onChange={(e) => updateMetadata('jurisdiction', e.target.value)}
                          placeholder="Tribunaux d'Antananarivo"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Mode affichage
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPageIcon(page.id)}
                    <div>
                      <h3>{page.title}</h3>
                      <p className="text-muted-foreground">
                        Version {page.version} • {page.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={page.is_active ? 'default' : 'secondary'}>
                      {page.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => previewPage(page.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEditing(page)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">Dernière mise à jour</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(page.last_updated).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">Description</p>
                    <p className="text-muted-foreground">
                      {page.metadata?.description || 'Aucune description'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-medium">Contact</p>
                    <p className="text-muted-foreground">
                      {page.metadata?.contact_email || 'Non défini'}
                    </p>
                  </div>
                </div>

                {page.metadata?.sections && (
                  <div className="space-y-2">
                    <p className="font-medium">Sections du document</p>
                    <div className="flex flex-wrap gap-1">
                      {page.metadata.sections.map((section: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Actions globales */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3>Actions globales</h3>
          <div className="flex gap-4">
            <Button 
              variant="outline"
              onClick={loadLegalPages}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/docs/COOKIE_SYSTEM_SETUP.md', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Documentation RGPD
            </Button>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Le système de cookies RGPD est 100% opérationnel. Les pages légales 
              sont accessibles via la navigation et les liens dans les cookies.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    </div>
  );
}