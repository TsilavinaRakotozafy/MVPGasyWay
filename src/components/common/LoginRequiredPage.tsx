import React, { memo } from 'react'
import { Button } from '../ui/button'

interface LoginRequiredPageProps {
  title: string
  description: string
  onLoginClick: () => void
}

/**
 * Composant standard pour les pages nécessitant une authentification
 * Externalisé d'App.tsx pour réduire la taille du composant principal
 */
export const LoginRequiredPage = memo(function LoginRequiredPage({ 
  title, 
  description, 
  onLoginClick 
}: LoginRequiredPageProps) {
  return (
    <div className="space-y-6">
      <h1>{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button 
        onClick={onLoginClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Se connecter
      </Button>
    </div>
  )
})