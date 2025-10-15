import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Sparkles, ArrowRight, SkipForward } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'
import { InterestSetup } from '../traveler/InterestSetup'

interface WelcomeScreenProps {
  onComplete: () => void
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { user } = useAuth()
  const [showInterestSetup, setShowInterestSetup] = useState(false)

  if (!user) {
    return null
  }

  if (showInterestSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <InterestSetup
          onComplete={onComplete}
          onSkip={onComplete}
          title="Personnalisez votre expérience GasyWay"
          description="Sélectionnez vos centres d'intérêt pour recevoir des recommandations de voyages personnalisées à Madagascar"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-800">
            Bienvenue sur GasyWay !
          </CardTitle>
          <CardDescription className="text-lg">
            Bonjour <span className="font-medium text-green-700">{user.profile.first_name}</span>, 
            découvrez les merveilles de Madagascar avec nous
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Votre compte a été créé avec succès ! Vous pouvez maintenant :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900">Explorer</h4>
                <p className="text-sm text-gray-600">Découvrir nos packs touristiques</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-8 h-8 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900">Personnaliser</h4>
                <p className="text-sm text-gray-600">Configurer vos préférences</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900">Réserver</h4>
                <p className="text-sm text-gray-600">Planifier votre voyage</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 text-center">
            <h3 className="font-medium text-gray-900 mb-2">
              Souhaitez-vous personnaliser votre expérience ?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Configurez vos centres d'intérêt pour recevoir des recommandations personnalisées
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setShowInterestSetup(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Personnaliser maintenant
              </Button>
              
              <Button
                variant="outline"
                onClick={onComplete}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Découvrir directement
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Vous pouvez toujours configurer vos préférences plus tard dans votre profil
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}