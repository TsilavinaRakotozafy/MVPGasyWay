import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Heart, Check, Plus } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { 
  mockInterests, 
  interestCategories, 
  getActiveInterests, 
  getInterestsByCategory,
  getUserInterests,
  type Interest 
} from '../../utils/interestsData'
import { useAuth } from '../../contexts/AuthContext'

interface InterestSelectorProps {
  onInterestsChange?: (selectedInterests: string[]) => void
  maxSelections?: number
  showTitle?: boolean
}

export function InterestSelector({ 
  onInterestsChange, 
  maxSelections = 10,
  showTitle = true 
}: InterestSelectorProps) {
  const { user } = useAuth()
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Charger les centres d'intérêt de l'utilisateur
    if (user) {
      const userInterests = getUserInterests(user.id)
      setSelectedInterests(userInterests)
    }
  }, [user])

  useEffect(() => {
    if (onInterestsChange) {
      onInterestsChange(selectedInterests)
    }
  }, [selectedInterests, onInterestsChange])

  const handleToggleInterest = async (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      // Retirer l'intérêt
      setSelectedInterests(prev => prev.filter(id => id !== interestId))
      
      const interest = mockInterests.find(i => i.id === interestId)
      if (interest) {
        toast.success(`${interest.icon} "${interest.name}" retiré de vos centres d'intérêt`)
      }
    } else {
      // Ajouter l'intérêt (avec limite)
      if (selectedInterests.length >= maxSelections) {
        toast.error(`Vous ne pouvez sélectionner que ${maxSelections} centres d'intérêt maximum`)
        return
      }
      
      setSelectedInterests(prev => [...prev, interestId])
      
      const interest = mockInterests.find(i => i.id === interestId)
      if (interest) {
        toast.success(`${interest.icon} "${interest.name}" ajouté à vos centres d'intérêt`)
      }
    }
  }

  const saveInterests = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour sauvegarder vos centres d\'intérêt')
      return
    }

    setLoading(true)
    try {
      // Simuler l'appel API pour sauvegarder
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(`✅ Vos ${selectedInterests.length} centres d'intérêt ont été sauvegardés !`)
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde de vos centres d\'intérêt')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedByCategory = (categoryId: string) => {
    const categoryInterests = getInterestsByCategory(categoryId)
    return categoryInterests.filter(interest => selectedInterests.includes(interest.id))
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div>
          <h2 className="text-xl font-medium mb-2">Vos centres d'intérêt</h2>
          <p className="text-gray-600 text-sm">
            Sélectionnez jusqu'à {maxSelections} centres d'intérêt pour personnaliser vos recommandations de voyage.
          </p>
        </div>
      )}

      {/* Résumé des sélections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-red-500" />
            Centres d'intérêt sélectionnés ({selectedInterests.length}/{maxSelections})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedInterests.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun centre d'intérêt sélectionné pour le moment.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map(interestId => {
                const interest = mockInterests.find(i => i.id === interestId)
                if (!interest) return null
                
                return (
                  <Badge
                    key={interestId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors"
                    onClick={() => handleToggleInterest(interestId)}
                  >
                    {interest.icon} {interest.name}
                  </Badge>
                )
              })}
            </div>
          )}
          
          {selectedInterests.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button onClick={saveInterests} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Sauvegarde...' : 'Sauvegarder mes centres d\'intérêt'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélection par catégories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Découvrir par catégorie</CardTitle>
          <CardDescription>
            Explorez les différents types d'expériences disponibles à Madagascar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={interestCategories[0].id} className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
              {interestCategories.map(category => (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  <span className="hidden sm:inline">{category.icon} </span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {interestCategories.map(category => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    {category.icon} {category.name}
                    <Badge variant="outline" className="text-xs">
                      {getSelectedByCategory(category.id).length} sélectionné{getSelectedByCategory(category.id).length > 1 ? 's' : ''}
                    </Badge>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getInterestsByCategory(category.id).map(interest => {
                    const isSelected = selectedInterests.includes(interest.id)
                    
                    return (
                      <Card
                        key={interest.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-green-500 bg-green-50' 
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleInterest(interest.id)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{interest.icon}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <h4 className="font-medium text-sm">{interest.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {interest.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              {interest.pack_count || 0} pack{(interest.pack_count || 0) > 1 ? 's' : ''}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}