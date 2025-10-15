/**
 * 🍪 POLITIQUE DES COOKIES GASYWAY
 * Documentation technique complète du système RGPD
 */

import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Calendar, Cookie, Settings, Eye, BarChart3, Target } from "lucide-react";
import { getAllCookiesDocumentation } from "../../utils/cookieManager";

interface CookiePolicyProps {
  onBack?: () => void;
  isStandalone?: boolean;
}

export function CookiePolicy({ onBack, isStandalone = false }: CookiePolicyProps) {
  const cookiesCatalog = getAllCookiesDocumentation();

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'necessary': return <Settings className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'marketing': return <Target className="h-4 w-4" />;
      case 'preferences': return <Eye className="h-4 w-4" />;
      default: return <Cookie className="h-4 w-4" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'necessary': return 'Cookies Nécessaires';
      case 'analytics': return 'Cookies Analytiques';
      case 'marketing': return 'Cookies Marketing';
      case 'preferences': return 'Cookies de Préférences';
      default: return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'necessary': 
        return 'Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas être désactivés.';
      case 'analytics': 
        return 'Ces cookies nous aident à comprendre comment vous utilisez notre site pour l\'améliorer.';
      case 'marketing': 
        return 'Ces cookies sont utilisés pour vous proposer des publicités pertinentes.';
      case 'preferences': 
        return 'Ces cookies mémorisent vos préférences pour personnaliser votre expérience.';
      default: 
        return '';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header avec navigation */}
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cookie className="h-5 w-5" />
            <span>Politique des cookies</span>
          </div>
          <h1>Gestion des Cookies</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Action rapide */}
        <Card className="p-4 bg-secondary/50">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h5>Gérer vos préférences</h5>
              <p className="text-muted-foreground">
                Personnalisez vos choix concernant les cookies à tout moment
              </p>
            </div>
            <Button 
              onClick={handleOpenCookieSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </Card>
      </div>

      {/* Contenu principal */}
      <Card className="p-8 space-y-8">
        {/* Introduction */}
        <section className="space-y-4">
          <h2>Qu'est-ce qu'un cookie ?</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous 
              visitez un site web. Les cookies nous permettent de reconnaître votre navigateur 
              et de capturer et mémoriser certaines informations.
            </p>
            <p>
              Sur GasyWay, nous utilisons les cookies pour améliorer votre expérience de 
              navigation, analyser le trafic et personnaliser le contenu selon vos préférences.
            </p>
          </div>
        </section>

        {/* Types de cookies */}
        <section className="space-y-4">
          <h2>Types de cookies utilisés sur GasyWay</h2>
          <div className="space-y-6">
            {Object.entries(cookiesCatalog).map(([category, cookies]) => (
              <Card key={category} className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category)}
                  <div className="space-y-1">
                    <h3>{getCategoryTitle(category)}</h3>
                    <p className="text-muted-foreground">
                      {getCategoryDescription(category)}
                    </p>
                  </div>
                  <Badge variant={category === 'necessary' ? 'destructive' : 'secondary'}>
                    {category === 'necessary' ? 'Obligatoire' : 'Optionnel'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {cookies.map((cookie, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{cookie.name}</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cookie.provider}</Badge>
                          <Badge variant="outline">{cookie.duration}</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{cookie.purpose}</p>
                      
                      {/* Informations supplémentaires inspirées de l'industrie */}
                      {category === 'analytics' && cookie.name.includes('Google') && (
                        <div className="bg-blue-50/50 p-3 rounded text-sm">
                          <strong>Protection de la vie privée :</strong> Ces données sont anonymisées 
                          et agrégées. Google Analytics respecte les standards de confidentialité 
                          de l'industrie du voyage.
                        </div>
                      )}
                      
                      {category === 'marketing' && cookie.name.includes('Facebook') && (
                        <div className="bg-orange-50/50 p-3 rounded text-sm">
                          <strong>Ciblage responsable :</strong> Utilisé uniquement pour améliorer 
                          la pertinence de nos recommandations touristiques et éviter la 
                          sur-sollicitation publicitaire.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Gestion des cookies */}
        <section className="space-y-4">
          <h2>Comment gérer vos cookies</h2>
          <div className="space-y-4 text-muted-foreground">
            <h3>Sur GasyWay</h3>
            <p>
              Vous pouvez à tout moment modifier vos préférences de cookies en cliquant 
              sur le bouton "Paramètres des cookies" disponible en bas de chaque page 
              ou en utilisant le bouton ci-dessus.
            </p>

            <h3>Dans votre navigateur</h3>
            <p>
              Vous pouvez également configurer votre navigateur pour :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Refuser tous les cookies</li>
              <li>Accepter seulement les cookies de première partie</li>
              <li>Supprimer les cookies existants</li>
              <li>Être alerté avant l'installation de nouveaux cookies</li>
            </ul>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h5 className="font-medium text-foreground mb-2">⚠️ Important</h5>
              <p>
                Désactiver certains cookies peut affecter le fonctionnement optimal 
                de notre site et limiter certaines fonctionnalités.
              </p>
            </div>
          </div>
        </section>

        {/* Cookies tiers */}
        <section className="space-y-4">
          <h2>Cookies de services tiers</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>Google Analytics</h3>
            <p>
              Nous utilisons Google Analytics pour analyser l'utilisation de notre site. 
              Ces cookies collectent des informations anonymes sur votre navigation.
            </p>
            <p>
              <strong>Données collectées :</strong> Pages visitées, durée des sessions, 
              source du trafic, données démographiques générales.
            </p>
            <p>
              <strong>Finalité :</strong> Améliorer notre site et comprendre les besoins 
              de nos utilisateurs.
            </p>

            <h3>Facebook Pixel</h3>
            <p>
              Le Facebook Pixel nous aide à mesurer l'efficacité de nos campagnes 
              publicitaires et à proposer des annonces pertinentes.
            </p>
            <p>
              <strong>Données collectées :</strong> Actions effectuées sur le site, 
              conversions, événements personnalisés.
            </p>
            <p>
              <strong>Finalité :</strong> Optimiser nos campagnes marketing et proposer 
              du contenu personnalisé.
            </p>
          </div>
        </section>

        {/* Durée de conservation */}
        <section className="space-y-4">
          <h2>Durée de conservation</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              La durée de conservation des cookies varie selon leur type et leur finalité :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</li>
              <li><strong>Cookies nécessaires :</strong> Maximum 24 heures</li>
              <li><strong>Cookies de préférences :</strong> 365 jours</li>
              <li><strong>Cookies analytiques :</strong> 2 ans (Google Analytics)</li>
              <li><strong>Cookies marketing :</strong> 90 jours (Facebook) à 180 jours (internes)</li>
            </ul>
            <p>
              Votre consentement pour les cookies optionnels est valable 365 jours. 
              Après cette période, nous vous demanderons de nouveau votre accord.
            </p>
          </div>
        </section>

        {/* Vos droits */}
        <section className="space-y-4">
          <h2>Vos droits</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Conformément au RGPD, vous disposez des droits suivants concernant 
              vos données collectées via les cookies :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Droit d'accès :</strong> Connaître les données collectées</li>
              <li><strong>Droit de rectification :</strong> Corriger les données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Supprimer vos données</li>
              <li><strong>Droit à la portabilité :</strong> Récupérer vos données</li>
              <li><strong>Droit d'opposition :</strong> Refuser le traitement</li>
              <li><strong>Droit de retrait :</strong> Retirer votre consentement</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à : privacy@gasyway.com
            </p>
          </div>
        </section>

        {/* Modifications */}
        <section className="space-y-4">
          <h2>Modifications de cette politique</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Nous pouvons modifier cette politique des cookies pour refléter les 
              changements dans nos pratiques ou pour des raisons opérationnelles, 
              légales ou réglementaires.
            </p>
            <p>
              Toute modification sera publiée sur cette page avec une date de 
              mise à jour révisée. Nous vous encourageons à consulter régulièrement 
              cette politique.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4 border-t pt-6">
          <h2>Contact</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              Pour toute question concernant notre utilisation des cookies :
            </p>
            <p>
              <strong>Email :</strong> privacy@gasyway.com<br />
              <strong>DPO :</strong> dpo@gasyway.com<br />
              <strong>Adresse :</strong> [Adresse à compléter]
            </p>
          </div>
        </section>

        {/* Actions rapides */}
        <section className="space-y-4 border-t pt-6">
          <h2>Actions rapides</h2>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleOpenCookieSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gérer mes cookies
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'privacy' }))}
            >
              Politique de confidentialité
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'terms' }))}
            >
              Conditions d'utilisation
            </Button>
          </div>
        </section>
      </Card>
    </div>
  );
}