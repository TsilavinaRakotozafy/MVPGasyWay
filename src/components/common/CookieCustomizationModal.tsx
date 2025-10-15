import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Cookie,
  Shield,
  BarChart,
  Target,
  Settings,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface CookieCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const cookieTypes = [
  {
    key: "necessary" as keyof CookiePreferences,
    title: "Cookies nécessaires",
    description:
      "Essentiels au fonctionnement du site. Ne peuvent pas être désactivés.",
    icon: Shield,
    required: true,
    examples: "Authentification, sécurité, préférences de base",
  },
  {
    key: "analytics" as keyof CookiePreferences,
    title: "Cookies analytiques",
    description:
      "Nous aident à comprendre comment vous utilisez notre site.",
    icon: BarChart,
    required: false,
    examples:
      "Google Analytics, statistiques de visite, performances",
  },
  {
    key: "marketing" as keyof CookiePreferences,
    title: "Cookies marketing",
    description:
      "Utilisés pour personnaliser la publicité et le contenu.",
    icon: Target,
    required: false,
    examples:
      "Publicités ciblées, réseaux sociaux, remarketing",
  },
  {
    key: "preferences" as keyof CookiePreferences,
    title: "Cookies de préférences",
    description:
      "Mémorisent vos choix pour améliorer votre expérience.",
    icon: Settings,
    required: false,
    examples: "Langue, région, thème, préférences d'affichage",
  },
];

export function CookieCustomizationModal({
  isOpen,
  onClose,
  onSave,
}: CookieCustomizationModalProps) {
  const [preferences, setPreferences] =
    useState<CookiePreferences>({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });

  // Charger les préférences actuelles au chargement
  useEffect(() => {
    if (isOpen) {
      const existingConsent = localStorage.getItem(
        "gasyway-cookie-consent",
      );
      if (existingConsent) {
        try {
          const parsed = JSON.parse(existingConsent);
          setPreferences({
            necessary: true, // Toujours true
            analytics: parsed.analytics || false,
            marketing: parsed.marketing || false,
            preferences: parsed.preferences || false,
          });
        } catch (error) {
          console.error(
            "Erreur parsing cookie consent:",
            error,
          );
        }
      }
    }
  }, [isOpen]);

  const handleToggle = (
    key: keyof CookiePreferences,
    value: boolean,
  ) => {
    if (key === "necessary") return; // Les cookies nécessaires ne peuvent pas être désactivés

    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };

    localStorage.setItem(
      "gasyway-cookie-consent",
      JSON.stringify({
        ...allAccepted,
        timestamp: new Date().toISOString(),
      }),
    );

    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated"),
    );
    toast.success("Tous les cookies acceptés");
    onSave?.(allAccepted);
    onClose();
  };

  const handleRejectOptional = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };

    localStorage.setItem(
      "gasyway-cookie-consent",
      JSON.stringify({
        ...onlyNecessary,
        timestamp: new Date().toISOString(),
      }),
    );

    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated"),
    );
    toast.success("Seuls les cookies nécessaires sont activés");
    onSave?.(onlyNecessary);
    onClose();
  };

  const handleSaveCustom = () => {
    localStorage.setItem(
      "gasyway-cookie-consent",
      JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      }),
    );

    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated"),
    );

    const enabledCount =
      Object.values(preferences).filter(Boolean).length - 1; // -1 car necessary est toujours true
    toast.success(
      `Préférences sauvegardées (${enabledCount} type${enabledCount > 1 ? "s" : ""} de cookies optionnel${enabledCount > 1 ? "s" : ""} activé${enabledCount > 1 ? "s" : ""})`,
    );

    onSave?.(preferences);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-primary" />
            <h5>Personnaliser les cookies</h5>
          </div>
          <DialogDescription>
            Choisissez quels types de cookies vous souhaitez
            autoriser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {cookieTypes.map((cookieType) => {
            const Icon = cookieType.icon;
            const isEnabled = preferences[cookieType.key];

            return (
              <Card
                key={cookieType.key}
                className="relative p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Icon
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cookieType.required ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium">
                          {cookieType.title}
                        </h5>
                        {cookieType.required && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            Requis
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight mb-1">
                        {cookieType.description}
                      </p>
                      <p className="text-xs text-muted-foreground/80 leading-tight">
                        <span className="font-medium">
                          Exemples :
                        </span>{" "}
                        {cookieType.examples}
                      </p>
                    </div>
                  </div>

                  <Switch
                    id={cookieType.key}
                    checked={isEnabled}
                    onCheckedChange={(value) =>
                      handleToggle(cookieType.key, value)
                    }
                    disabled={cookieType.required}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={cookieType.key}
                    className="sr-only"
                  >
                    {cookieType.title}
                  </Label>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <div className="w-full">
            <Button
              onClick={handleSaveCustom}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 py-1 mt-[0px] mr-[0px] mb-[8px] ml-[0px]"
            >
              Sauvegarder mes choix
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectOptional}
              size="sm"
              className="w-full mt-[0px] mr-[0px] mb-[8px] ml-[0px]"
            >
              Nécessaires seulement
            </Button>
            <Button
              variant="ghost"
              onClick={handleAcceptAll}
              size="sm"
              className="w-full"
            >
              Tout accepter
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}