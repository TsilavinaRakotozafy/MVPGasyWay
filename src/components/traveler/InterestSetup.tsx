import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Heart, X, Loader2, Save, SkipForward } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useAuth } from '../../contexts/AuthContextSQL'
import { supabase } from '../../utils/supabase/client'



interface Interest {
  id: string
  name: string
  icon?: string
}

interface InterestSetupProps {
  onComplete: () => void
  onSkip?: () => void
  title?: string
  description?: string
  showSkipButton?: boolean
  loading?: boolean
}

export function InterestSetup({ 
  onComplete, 
  onSkip, 
  title = "Personnalisez votre expérience",
  description = "Sélectionnez vos centres d'intérêt pour recevoir des recommandations personnalisées",
  showSkipButton = true,
  loading: externalLoading = false
}: InterestSetupProps) {
  const { user, refreshUser } = useAuth()
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInterests()
    loadUserInterests()
  }, [user])

  const loadInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('id, name, icon')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setInterests(data || [])
    } catch (error) {
      console.error('Erreur chargement intérêts:', error)
      toast.error('Erreur lors du chargement des centres d\'intérêt')
    }
  }

  const loadUserInterests = async () => {
    if (!user) return

    try {
      console.log('🔄 Chargement intérêts utilisateur depuis user_interests SQL')
      
      // Charger les intérêts depuis la table de liaison user_interests
      const { data, error } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id)

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      const userInterestIds = data?.map(item => item.interest_id) || []
      setSelectedInterests(userInterestIds)
      console.log('✅ Intérêts utilisateur chargés depuis SQL:', userInterestIds.length)
      
    } catch (error) {
      console.error('Erreur chargement intérêts utilisateur:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const saveInterests = async () => {
    if (!user) {
      console.error('❌ Pas d\'utilisateur connecté')
      toast.error('Utilisateur non connecté')
      return
    }

    setSaving(true)
    const startTime = Date.now()

    try {
      console.log('🔄 Sauvegarde intérêts dans user_interests SQL:', {
        userId: user.id,
        selectedInterests,
        count: selectedInterests.length
      })

      // Test de connexion rapide à la table user_interests
      const { data: testData, error: testError } = await supabase
        .from('user_interests')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1)

      if (testError && !testError.message.includes('PGRST116')) {
        console.error('❌ Erreur accès table user_interests:', testError)
        
        // Vérifier si c'est un problème RLS
        if (testError.message.includes('policy') || testError.message.includes('permission')) {
          throw new Error('Problème de permissions sur la table user_interests. Vérifiez les politiques RLS.')
        }
        
        throw testError
      }

      console.log('✅ Accès table user_interests confirmé')

      // 1. Supprimer toutes les anciennes associations avec timeout
      console.log('🗑️ Suppression des anciennes associations...')
      
      const deletePromise = supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout lors de la suppression')), 8000)
      )

      const { error: deleteError } = await Promise.race([deletePromise, timeoutPromise]) as any

      if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError)
        throw deleteError
      }

      console.log('✅ Anciennes associations supprimées')

      // 2. Insérer les nouvelles associations si nécessaire
      if (selectedInterests.length > 0) {
        console.log('📝 Insertion nouvelles associations:', selectedInterests.length)
        
        const insertData = selectedInterests.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
          created_at: new Date().toISOString()
        }))

        const insertPromise = supabase
          .from('user_interests')
          .insert(insertData)

        const insertTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout lors de l\'insertion')), 8000)
        )

        const { error: insertError } = await Promise.race([insertPromise, insertTimeoutPromise]) as any

        if (insertError) {
          console.error('❌ Erreur insertion:', insertError)
          throw insertError
        }

        console.log('✅ Nouvelles associations insérées')
      } else {
        console.log('ℹ️ Aucun intérêt à insérer')
      }

      const totalTime = Date.now() - startTime
      console.log(`✅ Intérêts sauvegardés avec succès en ${totalTime}ms`)

      // Rafraîchir les données utilisateur avec timeout
      try {
        console.log('🔄 Rafraîchissement données utilisateur...')
        const refreshPromise = refreshUser()
        const refreshTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout refresh utilisateur')), 5000)
        )
        
        await Promise.race([refreshPromise, refreshTimeout])
        console.log('✅ Données utilisateur rafraîchies')
      } catch (refreshError) {
        console.warn('⚠️ Erreur refresh utilisateur (non bloquante):', refreshError)
        // Ne pas bloquer le processus pour une erreur de refresh
      }

      const count = selectedInterests.length
      toast.success(
        count > 0 
          ? `${count} centre${count > 1 ? 's' : ''} d'intérêt sauvegardé${count > 1 ? 's' : ''} !`
          : 'Préférences sauvegardées !'
      )
      
      // Appeler onComplete avec un petit délai pour laisser le toast s'afficher
      setTimeout(() => {
        onComplete()
      }, 500)
      
    } catch (error: any) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Erreur sauvegarde intérêts après ${totalTime}ms:`, error)
      
      let errorMessage = 'Erreur lors de la sauvegarde'
      
      if (error.message?.includes('policy') || error.message?.includes('permission')) {
        errorMessage = 'Problème de permissions. Contactez le support.'
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = 'La sauvegarde prend trop de temps. Réessayez.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Problème de connexion. Vérifiez votre réseau.'
      }
      
      toast.error(`Échec de finalisation: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    console.log('⏭️ Skip centres d\'intérêt demandé')
    
    if (onSkip) {
      // Si on a une fonction onSkip personnalisée, l'utiliser
      console.log('🔄 Utilisation fonction onSkip personnalisée')
      try {
        onSkip()
      } catch (error) {
        console.error('❌ Erreur fonction onSkip:', error)
        toast.error('Erreur lors du passage')
      }
    } else {
      // Sinon, sauvegarder avec la sélection actuelle (même vide) et continuer
      console.log('🔄 Sauvegarde avant skip avec sélection actuelle:', selectedInterests.length)
      await saveInterests()
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4>Centres d'intérêt disponibles</h4>
          <Badge variant="outline" className="bg-accent text-accent-foreground">
            {selectedInterests.length} sélectionné{selectedInterests.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 max-h-48 md:max-h-64 overflow-y-auto pr-2">
          {interests.map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                selectedInterests.includes(interest.id)
                  ? 'bg-accent text-accent-foreground border-accent scale-105'
                  : 'bg-transparent text-foreground border-border hover:bg-secondary/50 hover:scale-105'
              }`}
            >
              {interest.icon && <span className="mr-2">{interest.icon}</span>}
              {interest.name}
              {selectedInterests.includes(interest.id) && (
                <X className="inline-block ml-2 h-3 w-3" />
              )}
            </button>
          ))}
        </div>

        {selectedInterests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun centre d'intérêt sélectionné. Vous pouvez en choisir plusieurs pour personnaliser vos recommandations.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={saveInterests}
          disabled={saving || externalLoading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {saving || externalLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder {selectedInterests.length > 0 && `(${selectedInterests.length})`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}