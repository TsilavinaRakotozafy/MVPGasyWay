import React from 'react'
import { useAuth } from '../../contexts/AuthContextSQL'

interface TravelerLayoutTestProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
  showLoginButton?: boolean
  onLoginClick?: () => void
}

export function TravelerLayoutTest({ children }: TravelerLayoutTestProps) {
  console.log('🔍 TravelerLayoutTest: Tentative d\'accès au contexte...')
  
  try {
    const { user, loading } = useAuth()
    console.log('✅ TravelerLayoutTest: Contexte Auth récupéré avec succès', { hasUser: !!user, loading })
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <h1>Test Layout</h1>
          <p>Utilisateur: {user ? user.email : 'Non connecté'}</p>
          <p>Chargement: {loading ? 'Oui' : 'Non'}</p>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ TravelerLayoutTest: Erreur d\'accès au contexte Auth:', error)
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <h1 className="text-red-800">Erreur de contexte d'authentification</h1>
        <p className="text-red-600">Impossible d'accéder au contexte AuthSQL</p>
        <pre className="text-xs">{error.toString()}</pre>
      </div>
    )
  }
}