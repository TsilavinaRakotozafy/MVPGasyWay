import React from 'react'
import { useAuth } from '../../contexts/AuthContextSQL'

export function AuthContextTest() {
  console.log('🔍 AuthContextTest: Tentative d\'accès au contexte AuthSQL...')
  
  try {
    const { user, loading } = useAuth()
    console.log('✅ AuthContextTest: Contexte AuthSQL récupéré avec succès', { 
      hasUser: !!user, 
      loading,
      userEmail: user?.email 
    })
    
    return (
      <div className="fixed top-4 left-4 z-50 bg-green-100 border border-green-200 rounded-lg p-3 text-green-800 text-xs max-w-xs">
        <div className="font-medium">✅ Contexte AuthSQL OK</div>
        <div>Utilisateur: {user ? user.email : 'Non connecté'}</div>
        <div>Statut: {loading ? 'Chargement...' : 'Prêt'}</div>
      </div>
    )
  } catch (error) {
    console.error('❌ AuthContextTest: Erreur d\'accès au contexte AuthSQL:', error)
    
    return (
      <div className="fixed top-4 left-4 z-50 bg-red-100 border border-red-200 rounded-lg p-3 text-red-800 text-xs max-w-xs">
        <div className="font-medium">❌ Erreur Contexte AuthSQL</div>
        <div>Erreur: {error.message}</div>
      </div>
    )
  }
}