import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { X, Cookie, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

interface CookieBannerProps {
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onCustomize?: () => void;
  className?: string;
}

export function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onCustomize,
  className
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieConsent = localStorage.getItem('gasyway-cookie-consent');
    if (!cookieConsent) {
      // Afficher la bannière après un court délai
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Écouter l'événement de réinitialisation
  useEffect(() => {
    const handleResetConsent = () => {
      setIsVisible(true);
    };

    window.addEventListener('reset-cookie-consent', handleResetConsent);
    
    return () => {
      window.removeEventListener('reset-cookie-consent', handleResetConsent);
    };
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('gasyway-cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated'));
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    localStorage.setItem('gasyway-cookie-consent', JSON.stringify({
      necessary: true, // Les cookies nécessaires ne peuvent pas être refusés
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated'));
    onRejectAll?.();
  };

  const handleCustomize = () => {
    onCustomize?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Écouter les événements de reset et d'ouverture des paramètres
  useEffect(() => {
    const handleResetConsent = () => {
      setIsVisible(true);
    };

    const handleOpenSettings = () => {
      setIsVisible(true);
    };

    window.addEventListener('reset-cookie-consent', handleResetConsent);
    window.addEventListener('open-cookie-settings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('reset-cookie-consent', handleResetConsent);
      window.removeEventListener('open-cookie-settings', handleOpenSettings);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-2">
      <Card className={cn(
        "mx-auto max-w-4xl p-6 shadow-lg border border-border",
        "bg-background/95 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-start gap-4">
          {/* Icône Cookie */}
          <div className="flex-shrink-0 mt-1">
            <Cookie className="h-6 w-6 text-primary" />
          </div>

          {/* Contenu principal */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h4 className="text-primary">Gestion des cookies</h4>
              <p className="text-muted-foreground leading-relaxed">
                Nous utilisons des cookies pour améliorer votre expérience sur GasyWay, 
                analyser le trafic et personnaliser le contenu. Certains cookies sont 
                nécessaires au fonctionnement du site, d'autres nécessitent votre consentement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAcceptAll}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Accepter tous les cookies
              </Button>
              
              <Button 
                onClick={handleRejectAll}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Refuser les cookies optionnels
              </Button>
              
              <Button 
                onClick={handleCustomize}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Personnaliser
              </Button>
            </div>

            {/* Liens légaux */}
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <button 
                onClick={handleCustomize}
                className="hover:text-primary transition-colors underline"
              >
                Paramètres des cookies
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'privacy' }))}
                className="hover:text-primary transition-colors underline"
              >
                Politique de confidentialité
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-legal', { detail: 'terms' }))}
                className="hover:text-primary transition-colors underline"
              >
                Conditions d'utilisation
              </button>
            </div>
          </div>

          {/* Bouton fermeture */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </div>
  );
}