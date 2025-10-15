import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner@2.0.3'
import { 
  User, 
  Upload, 
  Heart, 
  ArrowRight, 
  ArrowLeft,
  SkipForward,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'
import { InterestSetup } from '../traveler/InterestSetup'

interface FirstLoginSetupProps {
  onComplete: () => void
}

export function FirstLoginSetup({ onComplete }: FirstLoginSetupProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1) // 1: Bio/Photo, 2: Centres d'intérêt
  const [loading, setLoading] = useState(false)
  
  // État pour l'étape 1 : Bio + Photo
  const [profileData, setProfileData] = useState({
    bio: '',
    profile_picture_url: ''
  })

  const handleSkipStep1 = () => {
    setCurrentStep(2)
  }

  const handleCompleteStep1 = async () => {
    if (!profileData.bio.trim() && !profileData.profile_picture_url.trim()) {
      // Si rien n'est rempli, on skip automatiquement
      setCurrentStep(2)
      return
    }

    setLoading(true)
    try {
      // Mettre à jour l'utilisateur dans la table users unifiée
      const { error } = await supabase
        .from('users')
        .update({
          bio: profileData.bio.trim() || null,
          profile_picture_url: profileData.profile_picture_url.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      toast.success('Profil mis à jour avec succès !')
      setCurrentStep(2)
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const markSetupCompleted = async (showSuccessMessage = true) => {
    // Fonction centralisée pour marquer le setup comme terminé
    setLoading(true)
    try {
      console.log('🔄 Marquage setup comme terminé pour utilisateur:', user?.id)
      
      // 🔧 SOLUTION FINALE: Mettre à jour les deux - table users ET user_metadata
      // 1. Mettre à jour dans la table users
      const { error: tableError } = await supabase
        .from('users')
        .update({
          first_login_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (tableError) {
        console.error('❌ Erreur marquage setup terminé dans table:', tableError)
        // Ne pas s'arrêter ici, continuer avec user_metadata
      } else {
        console.log('✅ Setup marqué comme terminé dans la table users')
      }

      // 2. CRUCIAL: Mettre à jour les user_metadata pour que le fallback soit cohérent
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_login_completed: true,
          // Conserver les autres métadonnées existantes
          first_name: user?.first_name,
          last_name: user?.last_name,
          role: user?.role,
          gdpr_consent: user?.gdpr_consent,
          locale: user?.locale
        }
      })

      if (metadataError) {
        console.error('❌ Erreur mise à jour user_metadata:', metadataError)
        // Même en cas d'erreur, continuer pour éviter que l'utilisateur reste bloqué
      } else {
        console.log('✅ user_metadata mis à jour avec first_login_completed: true')
      }

      console.log('✅ Setup marqué comme terminé avec synchronisation complète')
      
      if (showSuccessMessage) {
        toast.success('Configuration terminée ! Bienvenue sur GasyWay 🎉')
      }
      
      // Toujours appeler onComplete pour débloquer l'utilisateur
      onComplete()
    } catch (error: any) {
      console.error('❌ Erreur critique finalisation setup:', error)
      console.log('🚨 Forçage completion pour éviter blocage utilisateur')
      
      // En cas d'erreur critique, forcer la completion côté client
      toast.warning('Configuration terminée (mode hors-ligne). Vous pourrez synchroniser plus tard.')
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteStep2 = async () => {
    await markSetupCompleted(true)
  }

  const handleSkipAll = async () => {
    await markSetupCompleted(false)
    toast.success('Configuration terminée ! Vous pourrez compléter votre profil plus tard.')
  }

  return (
    <div className="min-h-screen bg-[rgba(239,239,239,1)] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {currentStep === 1 ? (
              <User className="h-8 w-8 text-primary" />
            ) : (
              <Heart className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <h3>
            {currentStep === 1 ? 'Complétez votre profil' : 'Vos centres d\'intérêt'}
          </h3>
          
          <CardDescription>
            {currentStep === 1 
              ? 'Étape optionnelle pour personnaliser votre expérience'
              : 'Aidez-nous à vous recommander les meilleurs voyages'
            }
          </CardDescription>
          


          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Étape {currentStep} sur 2</span>
              <span>{Math.round((currentStep / 2) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 2) * 100} className="h-2 [&>div]:bg-accent" />
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 1 ? (
            // Étape 1 : Bio + Photo de profil
            <div className="space-y-6">


              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio personnelle</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Parlez-nous de vous, de vos passions de voyage, de ce qui vous motive à découvrir Madagascar..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Une bio engageante vous aide à vous connecter avec d'autres voyageurs
                  </p>
                </div>

                <div>
                  <Label htmlFor="profile_picture_url">Photo de profil (URL)</Label>
                  <div className="relative mt-1">
                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile_picture_url"
                      value={profileData.profile_picture_url}
                      onChange={(e) => setProfileData({ ...profileData, profile_picture_url: e.target.value })}
                      placeholder="https://example.com/votre-photo.jpg"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajoutez l'URL d'une photo pour personnaliser votre profil
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">

                
                <Button 
                  onClick={handleCompleteStep1}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Étape 2 : Centres d'intérêt
            <div className="space-y-6">


              {/* Composant de sélection des centres d'intérêt */}
              <InterestSetup
                onComplete={handleCompleteStep2}
                showSkipButton={true}
                onSkip={handleCompleteStep2}
                loading={loading}
              />



              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleSkipAll}
                  disabled={loading}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Passer tout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}