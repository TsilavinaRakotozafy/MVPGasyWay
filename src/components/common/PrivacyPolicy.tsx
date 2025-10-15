/**
 * 🔒 POLITIQUE DE CONFIDENTIALITÉ GASYWAY
 * Document institutionnel - Traitement des données personnelles
 */

import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Calendar, Shield, Database, Globe, Lock, AlertTriangle, Mail, FileText } from "lucide-react";
import { CookieSettingsLink } from './CookieSettingsLink';

interface PrivacyPolicyProps {
  onBack?: () => void;
  isStandalone?: boolean;
}

export function PrivacyPolicy({ onBack, isStandalone = false }: PrivacyPolicyProps) {
  
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header institutionnel */}
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span>Document officiel</span>
          </div>
          <h1>Politique de Confidentialité</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Version en vigueur depuis le {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <Card className="p-8 space-y-8">
        {/* Préambule institutionnel */}
        <section className="space-y-4">
          <h2>Préambule</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              La présente politique de confidentialité définit et vous informe de la manière 
              dont GasyWay utilise et protège les informations que vous nous transmettez, 
              le cas échéant, lorsque vous utilisez le présent site accessible à partir de l'URL suivante : 
              [URL du site] (ci-après le « Site »).
            </p>
            <p>
              Veuillez noter que cette politique de confidentialité est susceptible d'être modifiée 
              ou complétée à tout moment par GasyWay, notamment en vue de se conformer à toute évolution 
              réglementaire, jurisprudentielle, éditoriale ou technique. Dans un tel cas, la date de 
              sa mise à jour sera clairement identifiée en tête de la présente politique.
            </p>
          </div>
        </section>

        {/* Identité du responsable de traitement */}
        <section className="space-y-4">
          <h2>Article 1 - Responsable de traitement</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Le responsable de traitement des données à caractère personnel collectées sur le Site est :
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p>
                <strong>Dénomination sociale :</strong> GasyWay<br />
                <strong>Forme juridique :</strong> [À préciser]<br />
                <strong>Adresse du siège social :</strong> [Adresse complète à Madagascar]<br />
                <strong>Numéro d'immatriculation :</strong> [Numéro RCS ou équivalent malgache]<br />
                <strong>Email de contact :</strong> contact@gasyway.com<br />
                <strong>Téléphone :</strong> [Numéro à préciser]
              </p>
            </div>
            <p>
              Le Délégué à la Protection des Données (DPO) peut être contacté à l'adresse suivante : 
              dpo@gasyway.com
            </p>
          </div>
        </section>

        {/* Données collectées */}
        <section className="space-y-4">
          <h2>Article 2 - Données personnelles collectées et finalités</h2>
          <div className="space-y-6">
            
            <div className="space-y-4 text-muted-foreground">
              <h3>2.1 - Données collectées directement</h3>
              <p>
                Les données personnelles collectées directement auprès de l'utilisateur sont :
              </p>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground">Données d'identification</h4>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Nom et prénom</li>
                  <li>Adresse de courrier électronique</li>
                  <li>Numéro de téléphone</li>
                  <li>Date de naissance</li>
                  <li>Nationalité</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground">Données de transaction</h4>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Informations de réservation</li>
                  <li>Historique des achats</li>
                  <li>Préférences de voyage</li>
                  <li>Données de paiement (partiellement chiffrées)</li>
                </ul>
              </div>

              <h3>2.2 - Données collectées automatiquement</h3>
              <p>
                Lors de votre navigation sur le Site, sont automatiquement collectées :
              </p>
              
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground">Données techniques</h4>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Adresse IP</li>
                  <li>Type et version du navigateur</li>
                  <li>Système d'exploitation</li>
                  <li>Pages consultées et durée de consultation</li>
                  <li>Données de géolocalisation (si autorisée)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Finalités du traitement */}
        <section className="space-y-4">
          <h2>Article 3 - Finalités du traitement</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              GasyWay utilise les données personnelles collectées aux fins suivantes :
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-medium text-foreground">Exécution du service</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Gestion des comptes utilisateurs</li>
                  <li>Traitement et suivi des réservations</li>
                  <li>Fourniture du service client</li>
                  <li>Gestion des paiements et facturation</li>
                </ul>
              </div>

              <div className="border-l-4 border-secondary pl-4">
                <h4 className="font-medium text-foreground">Amélioration du service</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Analyse statistique de l'utilisation du Site</li>
                  <li>Personnalisation du contenu proposé</li>
                  <li>Développement de nouvelles fonctionnalités</li>
                  <li>Prévention de la fraude</li>
                </ul>
              </div>

              <div className="border-l-4 border-accent pl-4">
                <h4 className="font-medium text-foreground">Communication (sous réserve de consentement)</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Envoi de newsletters et informations commerciales</li>
                  <li>Communications relatives aux services réservés</li>
                  <li>Enquêtes de satisfaction</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Base légale */}
        <section className="space-y-4">
          <h2>Article 4 - Base légale du traitement</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Conformément aux dispositions du Règlement Général sur la Protection des Données (RGPD), 
              les traitements de données personnelles mis en œuvre par GasyWay sont fondés sur :
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">L'exécution du contrat (art. 6.1.b RGPD)</h4>
                <p className="text-sm">
                  Pour le traitement des réservations, la fourniture des services touristiques 
                  et la gestion de la relation contractuelle.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Le consentement (art. 6.1.a RGPD)</h4>
                <p className="text-sm">
                  Pour l'envoi de communications commerciales, l'utilisation de cookies 
                  non essentiels et la géolocalisation.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">L'intérêt légitime (art. 6.1.f RGPD)</h4>
                <p className="text-sm">
                  Pour l'amélioration des services, la prévention de la fraude 
                  et les analyses statistiques.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">L'obligation légale (art. 6.1.c RGPD)</h4>
                <p className="text-sm">
                  Pour la conservation des factures, les déclarations fiscales 
                  et le respect des obligations comptables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Destinataires */}
        <section className="space-y-4">
          <h2>Article 5 - Destinataires des données</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Les données personnelles collectées sont destinées exclusivement à GasyWay et, 
              le cas échéant, à ses sous-traitants dans les limites nécessaires à l'accomplissement 
              des tâches qui leur sont confiées.
            </p>
            
            <h3>5.1 - Partenaires touristiques</h3>
            <p>
              Les données nécessaires à l'exécution des prestations touristiques sont transmises 
              aux prestataires locaux (guides, hébergeurs, transporteurs) uniquement dans la mesure 
              nécessaire à la fourniture du service réservé.
            </p>

            <h3>5.2 - Prestataires techniques</h3>
            <p>
              Certaines données peuvent être traitées par nos prestataires techniques agissant 
              en qualité de sous-traitants (hébergement, paiement, maintenance) sous réserve 
              du respect de garanties appropriées de protection des données.
            </p>

            <h3>5.3 - Autorités légales</h3>
            <p>
              Les données peuvent être communiquées aux autorités compétentes dans le cadre 
              d'une procédure judiciaire, sur demande expresse de ces dernières ou en application 
              d'une obligation légale.
            </p>
          </div>
        </section>

        {/* Transferts */}
        <section className="space-y-4">
          <h2>Article 6 - Transferts de données hors Madagascar</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Certaines données personnelles peuvent faire l'objet de transferts vers des pays 
              tiers dans le cadre de l'utilisation de services d'hébergement ou de maintenance.
            </p>
            <p>
              Ces transferts sont encadrés par des garanties appropriées au sens de l'article 46 
              du RGPD, notamment par la signature de clauses contractuelles types approuvées 
              par la Commission européenne.
            </p>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Pays de destination :</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>États-Unis : Services cloud (Google, Amazon) - Certification Privacy Shield ou DPA</li>
                <li>Union Européenne : Hébergement et sauvegarde - Niveau de protection adéquat</li>
                <li>Singapour : Services de distribution de contenu (CDN)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conservation */}
        <section className="space-y-4">
          <h2>Article 7 - Durée de conservation</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Les données personnelles ne sont conservées que pour la durée strictement nécessaire 
              à la réalisation des finalités pour lesquelles elles sont traitées.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Données de compte</h4>
                <p className="text-sm">
                  <strong>Durée :</strong> Durée de vie du compte + 3 ans<br />
                  <strong>Base légale :</strong> Gestion de la relation contractuelle
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Données transactionnelles</h4>
                <p className="text-sm">
                  <strong>Durée :</strong> 10 ans<br />
                  <strong>Base légale :</strong> Obligations comptables et fiscales
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Données marketing</h4>
                <p className="text-sm">
                  <strong>Durée :</strong> 3 ans après dernier contact<br />
                  <strong>Base légale :</strong> Intérêt légitime commercial
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Données techniques</h4>
                <p className="text-sm">
                  <strong>Durée :</strong> 26 mois maximum<br />
                  <strong>Base légale :</strong> Amélioration du service
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="space-y-4">
          <h2>Article 8 - Sécurité des données</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              GasyWay met en œuvre toutes les mesures techniques et organisationnelles appropriées 
              afin de garantir un niveau de sécurité adapté au risque, conformément aux dispositions 
              de l'article 32 du RGPD.
            </p>
            
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Mesures techniques</h4>
                <ul className="space-y-1 list-disc list-inside text-sm">
                  <li>Chiffrement des données en transit et au repos</li>
                  <li>Contrôle d'accès et authentification renforcée</li>
                  <li>Surveillance continue des systèmes</li>
                  <li>Sauvegardes sécurisées et tests de restauration</li>
                </ul>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Mesures organisationnelles</h4>
                <ul className="space-y-1 list-disc list-inside text-sm">
                  <li>Formation du personnel aux enjeux de sécurité</li>
                  <li>Procédures de gestion des incidents</li>
                  <li>Audits de sécurité réguliers</li>
                  <li>Gestion des accès selon le principe du moindre privilège</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Droits */}
        <section className="space-y-4">
          <h2>Article 9 - Droits des personnes concernées</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Conformément aux dispositions du RGPD, vous disposez des droits suivants sur vos données personnelles :
            </p>
            
            <div className="grid gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit d'accès (art. 15 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit d'obtenir la confirmation que des données personnelles vous concernant 
                  sont ou ne sont pas traitées et, lorsqu'elles le sont, l'accès auxdites données.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit de rectification (art. 16 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit d'obtenir la rectification des données personnelles inexactes 
                  vous concernant et de compléter les données incomplètes.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit à l'effacement (art. 17 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit d'obtenir l'effacement de vos données personnelles dans certains cas 
                  prévus par la réglementation.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit à la portabilité (art. 20 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit de recevoir vos données dans un format structuré, couramment utilisé 
                  et lisible par machine.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit d'opposition (art. 21 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit de vous opposer au traitement de vos données personnelles 
                  pour des raisons tenant à votre situation particulière.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-foreground">Droit de limitation (art. 18 RGPD)</h4>
                <p className="text-sm">
                  Vous avez le droit d'obtenir la limitation du traitement dans certaines circonstances 
                  prévues par la réglementation.
                </p>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Modalités d'exercice de vos droits</h4>
              <p className="text-sm">
                Pour exercer vos droits, vous pouvez nous adresser votre demande :
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside mt-2">
                <li>Par courrier électronique : privacy@gasyway.com</li>
                <li>Par voie postale à l'adresse : [Adresse postale complète]</li>
              </ul>
              <p className="text-sm mt-2">
                Votre demande doit être accompagnée d'une copie de votre pièce d'identité. 
                Nous nous engageons à vous répondre dans un délai d'un mois à compter de la réception 
                de votre demande.
              </p>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="space-y-4">
          <h2>Article 10 - Cookies et traceurs</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Le Site utilise des cookies et autres traceurs soumis à votre consentement préalable, 
              à l'exception des cookies strictement nécessaires au fonctionnement du Site.
            </p>
            <p>
              Les modalités d'utilisation des cookies sont détaillées dans notre 
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary hover:text-primary/80 underline"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'cookies' }))}
              >
                Politique des Cookies
              </Button>, 
              accessible à tout moment sur le Site.
            </p>
            <div className="flex gap-4">
              <CookieSettingsLink variant="button">
                Gérer mes préférences
              </CookieSettingsLink>
            </div>
          </div>
        </section>

        {/* Réclamations */}
        <section className="space-y-4">
          <h2>Article 11 - Droit de réclamation</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Si vous estimez que le traitement de vos données personnelles constitue une violation 
              de la réglementation applicable, vous avez le droit d'introduire une réclamation auprès 
              de l'autorité de contrôle compétente.
            </p>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Autorités compétentes :</h4>
              <ul className="space-y-1 list-disc list-inside text-sm">
                <li>Madagascar : [Autorité nationale de protection des données]</li>
                <li>France (si applicable) : Commission Nationale de l'Informatique et des Libertés (CNIL)</li>
                <li>Union Européenne : Autorité de protection des données du pays de résidence</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Modifications */}
        <section className="space-y-4">
          <h2>Article 12 - Modifications de la politique</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              La présente politique de confidentialité peut être amenée à évoluer pour des raisons 
              notamment juridiques, jurisprudentielles ou techniques. Les modifications apportées 
              seront portées à votre connaissance par tout moyen utile.
            </p>
            <p>
              Il vous appartient de consulter régulièrement la dernière version en vigueur, 
              accessible à tout moment sur le Site. L'utilisation continue du Site vaut acceptation 
              des modifications apportées à la politique de confidentialité.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4 border-t pt-6">
          <h2>Article 13 - Contact</h2>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Responsable de traitement</h4>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>
                    <strong>GasyWay</strong><br />
                    [Adresse postale complète]<br />
                    Email : contact@gasyway.com<br />
                    Téléphone : [Numéro]
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Délégué à la Protection des Données</h4>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>
                    Email : dpo@gasyway.com<br />
                    Courrier : DPO - GasyWay<br />
                    [Adresse postale complète]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer légal */}
        <section className="space-y-2 border-t pt-6 text-sm text-muted-foreground">
          <p>
            <strong>Document :</strong> Politique de confidentialité GasyWay<br />
            <strong>Version :</strong> 1.0<br />
            <strong>Date d'entrée en vigueur :</strong> {new Date().toLocaleDateString('fr-FR')}<br />
            <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
          </p>
          <p>
            Cette politique est établie en conformité avec le Règlement (UE) 2016/679 du Parlement européen 
            et du Conseil du 27 avril 2016 (RGPD) et la législation malgache applicable en matière de 
            protection des données personnelles.
          </p>
        </section>
      </Card>
    </div>
  );
}