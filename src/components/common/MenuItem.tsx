import React from 'react'
import { DropdownMenuItem } from '../ui/dropdown-menu'
import { LucideIcon } from 'lucide-react'
import { cn } from '../ui/utils'

interface MenuItemProps {
  /** Icône Lucide à afficher */
  icon: LucideIcon
  /** Texte du menu */
  label: string
  /** Fonction appelée au clic */
  onClick?: () => void
  /** Variant de style */
  variant?: 'default' | 'destructive'
  /** Classes CSS additionnelles */
  className?: string
  /** Props additionnelles pour DropdownMenuItem */
  disabled?: boolean
}

/**
 * Composant réutilisable pour les éléments de menu avec icône + texte
 * Respecte le design system GasyWay avec les bonnes couleurs
 * 
 * USAGE:
 * <MenuItem 
 *   icon={User} 
 *   label="Mon profil" 
 *   onClick={() => navigate('profile')} 
 * />
 * 
 * <MenuItem 
 *   icon={LogOut} 
 *   label="Se déconnecter" 
 *   onClick={logout}
 *   variant="destructive" 
 * />
 */
export function MenuItem({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
  className,
  disabled,
  ...props 
}: MenuItemProps) {
  return (
    <DropdownMenuItem 
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={cn(
        // Override des styles ShadCN pour utiliser les couleurs GasyWay
        variant === 'default' && [
          "text-primary", // Texte couleur primaire GasyWay (#0d4047)
          "hover:bg-muted focus:bg-muted", // Fond gris clair au hover/focus (#ececf0)
          "hover:text-primary focus:text-primary", // Garder le texte primaire
        ],
        variant === 'destructive' && [
          "text-destructive", // Texte rouge destructif (#d4183d)
          "hover:bg-destructive/10 focus:bg-destructive/10", // Fond rouge léger
          "hover:text-destructive focus:text-destructive", // Garder le texte destructif
        ],
        "cursor-pointer", // Curseur pointer au lieu de default
        className
      )}
      {...props}
    >
      <Icon className="mr-3 h-4 w-4" />
      <span>{label}</span>
    </DropdownMenuItem>
  )
}