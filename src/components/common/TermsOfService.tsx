/**
 * 📋 CONDITIONS D'UTILISATION GASYWAY
 * Page légale complète avec contenu hardcodé sécurisé
 */

import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

interface TermsOfServiceProps {
  onBack?: () => void;
  isStandalone?: boolean;
}

export function TermsOfService({ onBack, isStandalone = false }: TermsOfServiceProps) {
  
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
            <FileText className="h-5 w-5" />
            <span>Document légal</span>
          </div>
          <h1>Conditions Générales d'Utilisation</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <Card className="p-8 space-y-8">
        {/* 1. Informations générales */}
        <section className="space-y-4">
          <h2>1. Informations générales</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
              de la plateforme GasyWay, service de réservation de voyages et d'expériences 
              touristiques à Madagascar.
            </p>
            <p>
              <strong>Société :</strong> GasyWay<br />
              <strong>Adresse :</strong> [Adresse à compléter]<br />
              <strong>Email :</strong> contact@gasyway.com<br />
              <strong>Téléphone :</strong> [Numéro à compléter]
            </p>
            <p>
              En utilisant notre service, vous acceptez sans réserve les présentes CGU.
            </p>
          </div>
        </section>

        {/* 2. Définitions */}
        <section className="space-y-4">
          <h2>2. Définitions</h2>
          <div className="space-y-3 text-muted-foreground">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Plateforme :</strong> Le site web et l'application GasyWay</li>
              <li><strong>Utilisateur :</strong> Toute personne utilisant la plateforme</li>
              <li><strong>Voyageur :</strong> Utilisateur effectuant une réservation</li>
              <li><strong>Partenaire :</strong> Prestataire de services touristiques</li>
              <li><strong>Pack :</strong> Offre de voyage ou d'expérience proposée</li>
            </ul>
          </div>
        </section>

        {/* 3. Accès et utilisation */}
        <section className="space-y-4">
          <h2>3. Accès et utilisation de la plateforme</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>3.1 Conditions d'accès</h3>
            <p>
              L'accès à GasyWay est gratuit pour la consultation. Certaines fonctionnalités 
              nécessitent la création d'un compte utilisateur.
            </p>
            
            <h3>3.2 Création de compte</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Vous devez être âgé de 18 ans minimum</li>
              <li>Les informations fournies doivent être exactes et à jour</li>
              <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
            </ul>

            <h3>3.3 Utilisation autorisée</h3>
            <p>
              Vous vous engagez à utiliser la plateforme conformément aux lois en vigueur 
              et aux présentes CGU. Sont notamment interdits :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>L'usage commercial non autorisé</li>
              <li>La diffusion de contenu illégal ou inapproprié</li>
              <li>Les tentatives de piratage ou d'intrusion</li>
              <li>L'usurpation d'identité</li>
            </ul>
          </div>
        </section>

        {/* 4. Services proposés */}
        <section className="space-y-4">
          <h2>4. Services proposés</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>4.1 Services de réservation</h3>
            <p>
              GasyWay met en relation les voyageurs et les prestataires de services 
              touristiques à Madagascar. Nous facilitons les réservations mais ne 
              sommes pas propriétaires des services proposés.
            </p>

            <h3>4.2 Rôle d'intermédiaire</h3>
            <p>
              GasyWay agit en qualité d'intermédiaire. Les prestations touristiques 
              sont fournies par nos partenaires sous leur entière responsabilité.
            </p>
          </div>
        </section>

        {/* 5. Réservations et paiements */}
        <section className="space-y-4">
          <h2>5. Réservations et paiements</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>5.1 Processus de réservation</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Sélection du pack ou service désiré</li>
              <li>Vérification des disponibilités en temps réel</li>
              <li>Saisie des informations voyageur</li>
              <li>Paiement sécurisé et confirmation immédiate</li>
              <li>Réception de la confirmation par email et SMS</li>
              <li>Transmission automatique au partenaire local</li>
            </ul>

            <h3>5.2 Prix et modalités de paiement</h3>
            <p>
              Les prix sont affichés en Ariary malgache (MGA) toutes taxes comprises. 
              Ils incluent la TVA malgache et les frais de service GasyWay. 
              Les prix peuvent varier selon :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>La saison touristique (haute/basse saison)</li>
              <li>La taille du groupe</li>
              <li>Les services optionnels sélectionnés</li>
              <li>Les fluctuations des taux de change (pour les prestations internationales)</li>
            </ul>
            <p>
              <strong>Moyens de paiement acceptés :</strong> Cartes bancaires internationales 
              (Visa, Mastercard), PayPal, virement bancaire pour les groupes.
            </p>

            <h3>5.3 Confirmation et documents de voyage</h3>
            <p>
              Votre réservation devient définitive après :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Encaissement du paiement</li>
              <li>Confirmation de disponibilité par le partenaire</li>
              <li>Émission du voucher électronique</li>
            </ul>
            <p>
              Vous recevrez dans les 24h un dossier voyage contenant tous les documents 
              nécessaires (vouchers, contacts locaux, recommandations, conditions météo).
            </p>

            <h3>5.4 Modifications de réservation</h3>
            <p>
              Les modifications sont possibles sous réserve de disponibilités et peuvent 
              entraîner des frais supplémentaires. Les demandes doivent être effectuées 
              au minimum 48h avant la date prévue.
            </p>
          </div>
        </section>

        {/* 6. Annulations et remboursements */}
        <section className="space-y-4">
          <h2>6. Annulations et remboursements</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>6.1 Barème d'annulation standard</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="font-medium text-foreground mb-2">Frais d'annulation selon le délai :</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Plus de 30 jours :</strong> Remboursement intégral (sauf frais de service 5%)</li>
                <li><strong>15 à 30 jours :</strong> 25% de frais d'annulation</li>
                <li><strong>7 à 14 jours :</strong> 50% de frais d'annulation</li>
                <li><strong>3 à 6 jours :</strong> 75% de frais d'annulation</li>
                <li><strong>Moins de 72h ou no-show :</strong> 100% de frais d'annulation</li>
              </ul>
            </div>
            <p>
              <em>Certains packs (traversées en bateau, hébergements spéciaux) peuvent avoir 
              des conditions particulières mentionnées lors de la réservation.</em>
            </p>

            <h3>6.2 Assurance voyage recommandée</h3>
            <p>
              Nous recommandons fortement la souscription d'une assurance voyage couvrant :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>L'annulation pour raisons médicales</li>
              <li>L'interruption de séjour</li>
              <li>Le rapatriement sanitaire</li>
              <li>La perte/vol de bagages</li>
              <li>Les frais médicaux à l'étranger</li>
            </ul>

            <h3>6.3 Force majeure et conditions exceptionnelles</h3>
            <p>
              En cas d'événements imprévisibles affectant Madagascar :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Cyclones tropicaux :</strong> Report gratuit ou remboursement intégral</li>
              <li><strong>Troubles politiques/sécuritaires :</strong> Remboursement ou avoir valable 2 ans</li>
              <li><strong>Pandémie/restrictions sanitaires :</strong> Conditions spéciales selon la situation</li>
              <li><strong>Grèves transport :</strong> Report sans frais ou solution alternative</li>
            </ul>

            <h3>6.4 Procédure de remboursement</h3>
            <p>
              Les remboursements s'effectuent sur le moyen de paiement initial dans un délai 
              de 14 jours ouvrés après acceptation de la demande d'annulation.
            </p>
          </div>
        </section>

        {/* 6bis. Conditions spécifiques au voyage à Madagascar */}
        <section className="space-y-4">
          <h2>6bis. Conditions spécifiques au voyage à Madagascar</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>6bis.1 Saisons et climat</h3>
            <p>
              Madagascar connaît deux saisons distinctes qui peuvent affecter certaines activités :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Saison sèche (avril-octobre) :</strong> Conditions optimales, tous les sites accessibles</li>
              <li><strong>Saison des pluies (novembre-mars) :</strong> Certaines pistes peuvent être impraticables</li>
            </ul>
            <p>
              Nous informons systématiquement de l'état des routes et adaptons les itinéraires si nécessaire.
            </p>

            <h3>6bis.2 Faune et observation</h3>
            <p>
              L'observation de la faune sauvage dépend de facteurs naturels. Bien que nos guides 
              soient expérimentés, nous ne garantissons pas l'observation d'espèces spécifiques 
              (lémuriens, baleines, etc.).
            </p>

            <h3>6bis.3 Standards d'hébergement</h3>
            <p>
              Les standards hôteliers malgaches peuvent différer des standards internationaux. 
              Nos partenaires sont sélectionnés pour leur qualité de service et leur engagement 
              écologique, certains hébergements privilégiant l'authenticité au luxe moderne.
            </p>

            <h3>6bis.4 Formalités d'entrée</h3>
            <p>
              Il est de votre responsabilité de vérifier :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Validité du passeport (6 mois minimum)</li>
              <li>Visa touristique (obligatoire pour la plupart des nationalités)</li>
              <li>Vaccinations recommandées</li>
              <li>Conditions sanitaires d'entrée</li>
            </ul>
            <p>
              GasyWay fournit des informations indicatives mais ne peut être tenue responsable 
              du refus d'entrée sur le territoire malgache.
            </p>
          </div>
        </section>

        {/* 7. Responsabilités */}
        <section className="space-y-4">
          <h2>7. Responsabilités</h2>
          <div className="space-y-3 text-muted-foreground">
            <h3>7.1 Responsabilité de GasyWay</h3>
            <p>
              En tant qu'intermédiaire de voyage, GasyWay s'engage à :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Sélectionner des partenaires fiables et certifiés</li>
              <li>Transmettre fidèlement vos réservations</li>
              <li>Fournir un support client avant, pendant et après le voyage</li>
              <li>Intervenir en cas de problème avec un prestataire</li>
              <li>Respecter les engagements tarifaires et contractuels</li>
            </ul>
            <p>
              <strong>Limites de responsabilité :</strong> Notre responsabilité se limite au montant 
              des services réservés. Nous ne sommes pas responsables des prestations directement 
              fournies par nos partenaires (guides, transporteurs, hébergeurs).
            </p>

            <h3>7.2 Responsabilité des partenaires locaux</h3>
            <p>
              Les prestataires (guides, hôtels, transporteurs) sont responsables de :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>La qualité et la sécurité de leurs prestations</li>
              <li>Le respect des normes locales et internationales</li>
              <li>La souscription d'assurances professionnelles appropriées</li>
              <li>La formation et certification de leur personnel</li>
            </ul>

            <h3>7.3 Responsabilité des voyageurs</h3>
            <p>
              En tant que voyageur, vous êtes responsable de :
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>La validité de vos documents de voyage</li>
              <li>Le respect des consignes de sécurité</li>
              <li>La souscription d'assurances voyage appropriées</li>
              <li>L'exactitude des informations fournies</li>
              <li>Le respect des lois et coutumes malgaches</li>
              <li>La protection de l'environnement et la biodiversité</li>
            </ul>

            <h3>7.4 Exclusions de responsabilité</h3>
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-lg">
              <p className="font-medium text-foreground mb-2">⚠️ GasyWay ne peut être tenue responsable :</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Des conditions météorologiques et phénomènes naturels</li>
                <li>Des décisions gouvernementales ou troubles sociaux</li>
                <li>Des grèves, pannes ou retards de transport</li>
                <li>Des vols, pertes ou dommages aux biens personnels</li>
                <li>Des accidents ou problèmes de santé (assurance obligatoire)</li>
                <li>Du non-respect des formalités par le voyageur</li>
                <li>Des modifications d'itinéraire pour des raisons de sécurité</li>
              </ul>
            </div>

            <h3>7.5 Assurance responsabilité civile professionnelle</h3>
            <p>
              GasyWay dispose d'une assurance responsabilité civile professionnelle 
              couvrant notre activité d'intermédiaire en voyage. Les références 
              de cette assurance sont disponibles sur demande.
            </p>
          </div>
        </section>

        {/* 8. Propriété intellectuelle */}
        <section className="space-y-4">
          <h2>8. Propriété intellectuelle</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Tous les éléments de la plateforme GasyWay (textes, images, logos, 
              graphismes, logiciels) sont protégés par le droit de la propriété 
              intellectuelle. Toute reproduction non autorisée est interdite.
            </p>
            <p>
              Les utilisateurs accordent à GasyWay le droit d'utiliser les contenus 
              qu'ils publient (avis, photos) à des fins promotionnelles.
            </p>
          </div>
        </section>

        {/* 9. Protection des données */}
        <section className="space-y-4">
          <h2>9. Protection des données personnelles</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Le traitement des données personnelles est régi par notre 
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary hover:text-primary/80 underline"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'privacy' }))}
              >
                Politique de Confidentialité
              </Button>.
            </p>
            <p>
              Conformément au RGPD, vous disposez de droits sur vos données 
              (accès, rectification, suppression, portabilité).
            </p>
          </div>
        </section>

        {/* 10. Modification des CGU */}
        <section className="space-y-4">
          <h2>10. Modification des CGU</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              GasyWay se réserve le droit de modifier les présentes CGU à tout moment. 
              Les utilisateurs seront informés des modifications par email ou 
              notification sur la plateforme.
            </p>
            <p>
              La poursuite de l'utilisation de la plateforme après modification 
              vaut acceptation des nouvelles conditions.
            </p>
          </div>
        </section>

        {/* 11. Droit applicable */}
        <section className="space-y-4">
          <h2>11. Droit applicable et juridictions</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Les présentes CGU sont régies par le droit malgache. En cas de litige, 
              les tribunaux d'Antananarivo seront seuls compétents, sauf disposition 
              légale contraire.
            </p>
            <p>
              Avant tout recours contentieux, nous privilégions la résolution 
              amiable des différends. Vous pouvez nous contacter à : 
              contact@gasyway.com
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4 border-t pt-6">
          <h2>Contact</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              Pour toute question concernant ces conditions d'utilisation :
            </p>
            <p>
              <strong>Email :</strong> legal@gasyway.com<br />
              <strong>Adresse :</strong> [Adresse à compléter]
            </p>
          </div>
        </section>
      </Card>
    </div>
  );
}