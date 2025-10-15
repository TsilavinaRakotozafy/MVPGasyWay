import React from 'react'
import { Input } from '../ui/input'
import { cn } from '../ui/utils'

interface GasyWayInputProps extends React.ComponentProps<"input"> {
  /**
   * Variant d'affichage de l'input
   */
  variant?: 'default' | 'muted'
  /**
   * Si true, affiche un style d'erreur
   */
  error?: boolean
}

/**
 * Composant Input personnalisé pour GasyWay
 * Respecte automatiquement la charte graphique et le design system
 * 
 * Caractéristiques :
 * - Placeholder : text-muted-foreground/40 (très discret)
 * - Contenu saisi : text-foreground (couleur principale #0d4047)
 * - Background : bg-input-background (#f3f3f5)
 * - Focus : border-ring avec ring optimisé
 * - Styles automatiques depuis globals.css
 */
export function GasyWayInput({ 
  className, 
  variant = 'default',
  error = false,
  ...props 
}: GasyWayInputProps) {
  return (
    <Input
      className={cn(
        // ✅ Styles de base respectant le design system GasyWay
        "bg-input-background border-border",
        "text-foreground placeholder:text-muted-foreground/40",
        "transition-all duration-200",
        
        // ✅ Focus states optimisés
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
        
        // ✅ Variants
        variant === 'muted' && "bg-muted border-muted-foreground/20",
        
        // ✅ État d'erreur
        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        
        // ✅ Classes personnalisées
        className
      )}
      {...props}
    />
  )
}