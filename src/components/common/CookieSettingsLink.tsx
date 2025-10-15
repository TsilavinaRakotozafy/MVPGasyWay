/**
 * 🔧 LIEN PARAMÈTRES COOKIES
 * Composant pour rouvrir la modal de personnalisation des cookies
 */

import React from "react";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";

interface CookieSettingsLinkProps {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function CookieSettingsLink({ 
  children = "Paramètres des cookies",
  variant = "link",
  size = "sm",
  className = "",
  showIcon = false
}: CookieSettingsLinkProps) {
  
  const handleOpenSettings = () => {
    // Déclencher l'événement pour ouvrir la modal
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenSettings}
      className={className || "text-muted-foreground hover:text-primary"}
    >
      {showIcon && <Settings className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
}