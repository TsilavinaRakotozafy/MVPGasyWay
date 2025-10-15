import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

export function InterestsEmojiTest() {
  // Test d'affichage des emoji
  const testData = [
    {
      id: '1',
      name: 'Randonnée en montagne',
      icon: '🥾',
      category_data: {
        id: 'cat1',
        name: 'Nature & Paysages',
        icon: '🌿'
      }
    },
    {
      id: '2',
      name: 'Artisanat local',
      icon: '🎨',
      category_data: {
        id: 'cat2',
        name: 'Culture & Traditions',
        icon: '🎭'
      }
    },
    {
      id: '3',
      name: 'Plongée sous-marine',
      icon: '🤿',
      category_data: {
        id: 'cat3',
        name: 'Aventure & Sport',
        icon: '🏔️'
      }
    },
    {
      id: '4',
      name: 'Plages de Nosy Be',
      icon: '🏝️',
      category_data: {
        id: 'cat4',
        name: 'Beach & Détente',
        icon: '🏖️'
      }
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test d'affichage des Emoji</CardTitle>
          <CardDescription>
            Vérification que les emoji des centres d'intérêt et catégories s'affichent correctement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testData.map((interest) => (
              <Card key={interest.id} className="text-center">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Emoji du centre d'intérêt */}
                    <div className="flex justify-center">
                      <span className="text-4xl">{interest.icon}</span>
                    </div>
                    
                    {/* Nom du centre d'intérêt */}
                    <h3 className="font-medium text-base">{interest.name}</h3>
                    
                    {/* Catégorie avec emoji */}
                    <div className="flex items-center justify-center space-x-1 text-xs text-blue-600">
                      <span className="text-sm">{interest.category_data.icon}</span>
                      <span>{interest.category_data.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Test des Emoji</h4>
            <p className="text-green-700 text-sm">
              Ce composant teste l'affichage des emoji pour les centres d'intérêt et leurs catégories.
              Si vous voyez les emoji correctement ci-dessus, alors l'implémentation fonctionne !
            </p>
            <div className="mt-3 text-xs text-green-600">
              <p><strong>Emoji des centres d'intérêt :</strong> 🥾 🎨 🤿 🏝️</p>
              <p><strong>Emoji des catégories :</strong> 🌿 🎭 🏔️ 🏖️</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InterestsEmojiTest