import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner@2.0.3'
import { 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  Loader2
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { EmailVerificationPending } from './EmailVerificationPending'
import { getAuthCallbackUrl } from '../../utils/figma-make-config'
import { PhoneInput } from '../common/PhoneInput'

interface SignupFormProps {
  onSignupSuccess: () => void
  onBackToLogin: () => void
}

export function SignupForm({ onSignupSuccess, onBackToLogin }: SignupFormProps) {
  const [loading, setLoading] = useState(false)
  const [emailVerificationPending, setEmailVerificationPending] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    // Table users
    email: '',
    password: '',
    confirmPassword: '',
    gdpr_consent: false,
    locale: 'fr' as 'fr' | 'en',
    
    // Table profiles
    first_name: '',
    last_name: '',
    phone: {
      countryCode: '+261', // Madagascar par défaut
      phoneNumber: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Afficher l'écran de vérification email si nécessaire
  if (emailVerificationPending) {
    return (
      <EmailVerificationPending 
        email={emailVerificationPending}
        onBackToLogin={onBackToLogin}
      />
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validation email
    if (!formData.email) {
      newErrors.email = 'Email requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide'
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères'
    }

    // Confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    // Consentement RGPD obligatoire
    if (!formData.gdpr_consent) {
      newErrors.gdpr_consent = 'Vous devez accepter les conditions d\'utilisation'
    }

    // Champs profil obligatoires
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Prénom requis'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Nom requis'
    }

    if (!formData.phone.phoneNumber.trim()) {
      newErrors.phone = 'Numéro de téléphone requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const completePartialRegistration = async (userId: string, formData: any) => {
    console.log('🔧 Complétion inscription partielle pour:', userId)

    // Créer/Mettre à jour l'entrée dans la table users unifiée
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: `${formData.phone.countryCode} ${formData.phone.phoneNumber}`,
        role: 'voyageur',
        status: 'active',
        first_login_completed: false,
        gdpr_consent: formData.gdpr_consent,
        locale: formData.locale,
        interests: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (userError) throw new Error(`Erreur completion table users unifiée: ${userError.message}`)

    console.log('✅ Inscription partielle complétée dans table unifiée!')
    toast.success('Inscription complétée avec succès!')
    onSignupSuccess()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setLoading(true)

    // Timeout de sécurité pour éviter que le bouton reste bloqué
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout d\'inscription - reset du loading')
      setLoading(false)
    }, 15000) // 15 secondes pour l'inscription qui peut prendre plus de temps

    try {
      console.log('🔄 Début création compte:', formData.email)

      // 0. Tentative de signUp - Supabase nous dira si l'email existe déjà

      // 1. Créer l'utilisateur avec Supabase Auth (avec confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: `${formData.phone.countryCode} ${formData.phone.phoneNumber}`,
            role: 'voyageur'
          }
        }
      })

      console.log('📧 Résultat signUp:', { authData, authError })

      if (authError) {
        console.error('❌ Erreur Auth signUp:', authError)
        
        // Si l'email existe déjà, on essaie de se connecter pour récupérer l'ID
        if (authError.message?.includes('already registered')) {
          console.log('🔄 Email déjà enregistré - tentative de connexion pour récupérer l\'ID')
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          })
          
          if (loginData.user) {
            console.log('✅ Connexion réussie - complétion de l\'inscription')
            await completePartialRegistration(loginData.user.id, formData)
            return
          } else {
            throw new Error('Ce compte existe déjà mais le mot de passe ne correspond pas. Utilisez "Se connecter".')
          }
        }
        
        throw authError
      }
      
      if (!authData.user) {
        throw new Error('Utilisateur non créé par Supabase Auth')
      }

      const userId = authData.user.id
      console.log('✅ Utilisateur Auth créé:', userId)

      // Vérifier si email confirmation est requise
      if (!authData.session) {
        console.log('📧 Email confirmation requise')
        setEmailVerificationPending(formData.email)
        clearTimeout(timeoutId)
        setLoading(false)
        toast.success('Compte créé ! Vérifiez votre email pour confirmer votre adresse.')
        return
      }

      // 2. Attendre un peu pour que Supabase se synchronise
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Créer/Mettre à jour l'entrée dans la table users unifiée (UPSERT)
      console.log('📝 Upsert dans table users unifiée...')
      const { error: userError, data: userData } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: `${formData.phone.countryCode} ${formData.phone.phoneNumber}`,
          role: 'voyageur',
          status: 'active',
          first_login_completed: false, // Déclenche FirstLoginSetup
          gdpr_consent: formData.gdpr_consent,
          locale: formData.locale,
          interests: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false // Met à jour si existe déjà
        })
        .select()

      if (userError) {
        console.error('❌ Erreur upsert users unifiée:', userError)
        throw new Error(`Erreur table users unifiée: ${userError.message}`)
      }

      console.log('✅ Utilisateur upsert dans table users unifiée:', userData)
      console.log('🎉 Inscription complète réussie!')

      toast.success('Compte créé avec succès ! Vous pourrez compléter votre profil à la première connexion.')
      clearTimeout(timeoutId) // Annuler le timeout en cas de succès
      onSignupSuccess()

    } catch (error: any) {
      clearTimeout(timeoutId) // Annuler le timeout en cas d'erreur
      console.error('❌ Erreur inscription:', error)
      
      if (error.message?.includes('User already registered')) {
        toast.error('Cette adresse email est déjà utilisée')
      } else if (error.message?.includes('Password should be at least')) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères')
      } else if (error.message?.includes('invalid') && error.message?.includes('email')) {
        toast.error(
          `❌ Email "${formData.email}" rejeté par Supabase`,
          {
            description: 'Vérifiez votre configuration Supabase Auth (confirmations email, domaines autorisés)',
            duration: 8000
          }
        )
      } else {
        toast.error(error.message || 'Erreur lors de la création du compte')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Créer un compte GasyWay</CardTitle>
          <CardDescription>
            Rejoignez notre plateforme de tourisme à Madagascar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de connexion */}
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre@email.com"
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe <span className="text-red-500">*</span></Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Jean"
                    className="pl-10"
                  />
                </div>
                {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <Label htmlFor="last_name">Nom <span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Dupont"
                  className="mt-1"
                />
                {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <PhoneInput
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              error={errors.phone}
              required={true}
              autoDetectCountry={true}
            />

            <div>
              <Label htmlFor="locale">Langue préférée</Label>
              <Select value={formData.locale} onValueChange={(value) => setFormData({ ...formData, locale: value as 'fr' | 'en' })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consentement obligatoire */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onCheckedChange={(checked) => setFormData({ ...formData, gdpr_consent: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="gdpr_consent" className="text-sm">
                    J'accepte les conditions d'utilisation et la politique de confidentialité <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">
                    En cochant cette case, vous consentez au traitement de vos données personnelles conformément au RGPD.
                  </p>
                </div>
              </div>
              {errors.gdpr_consent && <p className="text-sm text-red-500">{errors.gdpr_consent}</p>}
            </div>

            {/* Boutons d'action */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer mon compte
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToLogin}
                className="w-full"
                disabled={loading}
              >
                Retour à la connexion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}