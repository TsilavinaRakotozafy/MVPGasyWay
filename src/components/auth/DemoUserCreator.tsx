import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export function DemoUserCreator() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const createDemoUsers = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('Utilisateurs de démo créés avec succès ! Vous pouvez maintenant vous connecter.')
      } else {
        setError(result.error || 'Erreur lors de la création des utilisateurs')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="text-center">
        <Button
          onClick={createDemoUsers}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Création en cours...' : 'Créer les comptes de test'}
        </Button>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}