import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Heart, Check, Plus, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'

interface Interest {
  id: string
  name: string
  slug?: string
  description?: string
  icon_url?: string
  icon?: string
  status: 'active' | 'inactive'
}

interface InterestSelectorProps {
  onInterestsChange?: (selectedInterests: string[]) => void
  maxSelections?: number
  showTitle?: boolean
}

export function InterestSelectorSQL({ 
  onInterestsChange, 
  maxSelections,
  showTitle = true 
}: InterestSelectorProps) {
  const { user, refreshUser } = useAuth()
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInterests()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserInterests()
    }
  }, [user])

  useEffect(() => {
    if (onInterestsChange) {
      onInterestsChange(selectedInterests)
    }
  }, [selectedInterests, onInterestsChange])

  const loadInterests = async () => {
    try {
      setLoading(true)
      console.log('🔄 Chargement intérêts depuis table interests')
      
      const { data, error } = await supabase
        .from('interests')
        .select('id, name, slug, description, icon_url, icon, status')
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      setInterests(data || [])
      console.log('✅ Intérêts chargés depuis SQL:', data?.length || 0)
    } catch (error) {
      console.error('❌ Erreur chargement intérêts:', error)
      toast.error('Erreur lors du chargement des centres d\'intérêt')
    } finally {
      setLoading(false)
    }
  }

  const loadUserInterests = async () => {
    if (!user) return

    try {
      console.log('🔄 Chargement intérêts utilisateur depuis user_interests')
      
      const { data, error } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id)

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      const userInterestIds = data?.map(item => item.interest_id) || []
      setSelectedInterests(userInterestIds)
      console.log('✅ Intérêts utilisateur chargés:', userInterestIds.length)
    } catch (error) {
      console.error('❌ Erreur chargement intérêts utilisateur:', error)
    }
  }

  const handleToggleInterest = async (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      // Retirer l'intérêt
      setSelectedInterests(prev => prev.filter(id => id !== interestId))
      
      const interest = interests.find(i => i.id === interestId)
      if (interest) {
        toast.success(`"${interest.name}" retiré de vos centres d'intérêt`)
      }
    } else {
      // Ajouter l'intérêt (avec limite optionnelle)
      if (maxSelections && selectedInterests.length >= maxSelections) {
        toast.error(`Vous ne pouvez sélectionner que ${maxSelections} centres d'intérêt maximum`)
        return
      }
      
      setSelectedInterests(prev => [...prev, interestId])
      
      const interest = interests.find(i => i.id === interestId)
      if (interest) {
        toast.success(`"${interest.name}" ajouté à vos centres d'intérêt`)
      }
    }
  }

  const saveInterests = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour sauvegarder vos centres d\'intérêt')
      return
    }

    setSaving(true)
    try {
      console.log('🔄 Sauvegarde intérêts dans user_interests:', selectedInterests)

      // 1. Supprimer toutes les anciennes associations
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // 2. Insérer les nouvelles associations
      if (selectedInterests.length > 0) {
        const insertData = selectedInterests.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
          created_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(insertData)

        if (insertError) throw insertError
      }

      // 3. Rafraîchir les données utilisateur
      await refreshUser()

      console.log('✅ Intérêts sauvegardés dans user_interests')
      toast.success(`✅ Vos ${selectedInterests.length} centres d'intérêt ont été sauvegardés !`)
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde intérêts:', error)
      toast.error('Erreur lors de la sauvegarde de vos centres d\'intérêt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Chargement des centres d'intérêt...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div>
          <h2 className="text-xl font-medium mb-2">Vos centres d'intérêt</h2>
          <p className="text-gray-600 text-sm">
            Sélectionnez vos centres d'intérêt pour personnaliser vos recommandations de voyage.
          </p>
        </div>
      )}

      {/* Centres d'intérêt - Section unifiée */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Centres d'intérêt ({selectedInterests.length})</CardTitle>
            <CardDescription>
              Personnalisez votre expérience avec des recommandations adaptées à vos passions
            </CardDescription>
          </div>
          {selectedInterests.length > 0 && (
            <Button 
              onClick={saveInterests} 
              disabled={saving} 
              className="ml-4 shrink-0"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé des sélections */}
          <div className="space-y-4">

            
            {selectedInterests.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun centre d'intérêt sélectionné pour le moment.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map(interestId => {
                  const interest = interests.find(i => i.id === interestId)
                  if (!interest) return null
                  
                  return (
                    <Badge
                      key={interestId}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors"
                      onClick={() => handleToggleInterest(interestId)}
                    >
                      {interest.icon_url && (
                        <img src={interest.icon_url} alt="" className="w-3 h-3 mr-1" />
                      )}
                      {interest.name}
                    </Badge>
                  )
                })}
              </div>
            )}
            

          </div>

          {/* Catalogue de sélection */}
          <div className="space-y-4">

            {interests.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun centre d'intérêt disponible</h3>
                <p className="text-gray-500">
                  Les centres d'intérêt sont en cours de configuration.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[400px] overflow-y-auto scrollbar-default pr-2">
                {interests.map(interest => {
                  const isSelected = selectedInterests.includes(interest.id)
                  
                  return (
                    <Card
                      key={interest.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'shadow-[inset_0_0_0_2px_#22c55e] bg-green-50' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => handleToggleInterest(interest.id)}
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {interest.icon_url && (
                                <img 
                                  src={interest.icon_url} 
                                  alt={interest.name}
                                  className="w-6 h-6"
                                />
                              )}
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {interest.icon && (
                            <div className="text-2xl mb-1">
                              {interest.icon}
                            </div>
                          )}
                          <h4 className="font-medium text-sm">{interest.name}</h4>
                          {interest.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {interest.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}