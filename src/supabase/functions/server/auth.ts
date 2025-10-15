import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function signupUser(email: string, password: string, firstName: string, lastName: string, role: string = 'traveler') {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // 1. Créer l'utilisateur avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        first_name: firstName, 
        last_name: lastName 
      },
      email_confirm: true // Auto-confirm since we don't have email configured
    })

    if (authError) {
      throw new Error(`Erreur création auth: ${authError.message}`)
    }

    const userId = authData.user.id

    // 2. Créer l'entrée dans la table users via Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        status: 'active',
        gdpr_consent: true,
        locale: 'fr',
        first_name: firstName,
        last_name: lastName,
        role: role,
        first_login_completed: false
      })
      .select()
      .single()

    if (userError) {
      throw new Error(`Erreur création utilisateur: ${userError.message}`)
    }

    return {
      success: true,
      user: {
        id: userId,
        email: email,
        profile: userData
      }
    }

  } catch (error) {
    console.error('Erreur signup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getUserProfile(userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Récupérer l'utilisateur depuis Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      return null
    }

    return {
      id: userId,
      email: userData.email,
      profile: userData,
      user: userData
    }

  } catch (error) {
    console.error('Erreur getUserProfile:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Mettre à jour le profil dans Supabase
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur mise à jour: ${error.message}`)
    }

    return {
      success: true,
      profile: updatedProfile
    }

  } catch (error) {
    console.error('Erreur updateUserProfile:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function checkUserAccess(accessToken: string) {
  // Créer un client Supabase avec le token de l'utilisateur pour valider l'accès
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    console.log('🔍 [Auth] Vérification accès utilisateur avec token...')
    
    // Vérifications préliminaires du token
    if (!accessToken) {
      console.error('❌ [Supabase] Token d\'accès vide ou null')
      return { authorized: false, user: null, error: 'Token manquant' }
    }

    if (accessToken.length < 20) {
      console.error('❌ [Supabase] Token trop court, probablement invalide:', accessToken.length, 'caractères')
      return { authorized: false, user: null, error: 'Token invalide' }
    }

    // Vérifier que le token a le format JWT basique (3 parties séparées par des points)
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      console.error('❌ [Supabase] Token n\'a pas le format JWT valide')
      return { authorized: false, user: null, error: 'Format token invalide' }
    }

    // Vérifier le contenu du payload JWT
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      if (!payload.sub) {
        console.error('❌ [Supabase] Token JWT sans claim "sub" requis')
        return { authorized: false, user: null, error: 'Token invalide - claim manquant' }
      }
      if (!payload.exp) {
        console.error('❌ [Supabase] Token JWT sans claim "exp" requis')
        return { authorized: false, user: null, error: 'Token invalide - expiration manquante' }
      }
      
      // ✅ Vérification d'expiration plus tolérante (5 minutes de grâce)
      const now = Math.floor(Date.now() / 1000)
      const gracePeriod = 300 // 5 minutes en secondes
      if (payload.exp < (now - gracePeriod)) {
        console.error('❌ [Supabase] Token JWT expiré')
        return { 
          authorized: false, 
          user: null, 
          error: 'Token expiré',
          shouldRefresh: true 
        }
      }
    } catch (decodeError) {
      console.warn('⚠️ [Supabase] Erreur décodage payload JWT, on continue quand même:', decodeError)
      // Ne pas bloquer sur cette erreur, laisser Supabase gérer
    }
    
    // Utiliser le token JWT pour récupérer l'utilisateur
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (error) {
      // Améliorer les messages d'erreur selon le type d'erreur
      const errorMessage = error.message
      
      if (errorMessage.includes('session_missing') || errorMessage.includes('Auth session missing')) {
        console.error('❌ [Supabase] Session d\'authentification manquante - Token probablement expiré')
        return { 
          authorized: false, 
          user: null, 
          error: 'Session expirée',
          shouldRefresh: true 
        }
      } else if (errorMessage.includes('invalid_token') || errorMessage.includes('Invalid JWT')) {
        console.error('❌ [Supabase] Token JWT invalide ou malformé')
        return { 
          authorized: false, 
          user: null, 
          error: 'Token invalide',
          shouldRefresh: true 
        }
      } else if (errorMessage.includes('expired')) {
        console.error('❌ [Supabase] Token expiré')
        return { 
          authorized: false, 
          user: null, 
          error: 'Token expiré',
          shouldRefresh: true 
        }
      } else if (errorMessage.includes('missing sub claim')) {
        console.error('❌ [Supabase] Token sans claim "sub" - token corrompu')
        return { 
          authorized: false, 
          user: null, 
          error: 'Token corrompu',
          shouldRefresh: true 
        }
      } else {
        console.error('❌ [Supabase] Erreur validation token:', errorMessage)
        return { 
          authorized: false, 
          user: null, 
          error: errorMessage 
        }
      }
    }
    
    if (!user) {
      console.error('❌ [Supabase] Aucun utilisateur trouvé pour ce token valide')
      return { 
        authorized: false, 
        user: null, 
        error: 'Utilisateur introuvable' 
      }
    }

    console.log('✅ [Supabase] Utilisateur trouvé:', user.id, user.email)

    // Récupérer le profil complet depuis Supabase
    const userProfile = await getUserProfile(user.id)
    
    if (!userProfile) {
      console.error('❌ [Supabase] Profil utilisateur non trouvé pour:', user.id)
      return { 
        authorized: false, 
        user: null, 
        error: 'Profil utilisateur manquant' 
      }
    }

    console.log('✅ [Supabase] Profil trouvé:', userProfile.profile.role, userProfile.user.status)

    // Vérifier le statut de l'utilisateur
    if (userProfile.user.status === 'blocked') {
      console.log('⚠️ [Auth] Utilisateur bloqué:', user.id)
      return { 
        authorized: false, 
        user: null, 
        blocked: true,
        error: 'Compte bloqué' 
      }
    }

    if (userProfile.user.status === 'deleted') {
      console.log('⚠️ [Auth] Utilisateur supprimé:', user.id)
      return { 
        authorized: false, 
        user: null, 
        error: 'Compte supprimé' 
      }
    }

    return {
      authorized: true,
      user: userProfile
    }

  } catch (error) {
    console.error('💥 [Auth] Erreur critique checkUserAccess:', error)
    return { 
      authorized: false, 
      user: null, 
      error: 'Erreur serveur d\'authentification' 
    }
  }
}

export async function initializeDemoUsers() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    console.log('Initialisation des utilisateurs de démo...')

    // Créer l'utilisateur admin
    const adminEmail = 'admin@gasyway.mg'
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'admin123',
      user_metadata: { 
        first_name: 'Admin', 
        last_name: 'GasyWay' 
      },
      email_confirm: true
    })

    if (!adminError && adminData.user) {
      const adminUserId = adminData.user.id
      
      // Créer les données admin dans Supabase
      await supabase
        .from('users')
        .upsert({
          id: adminUserId,
          email: adminEmail,
          status: 'active',
          gdpr_consent: true,
          locale: 'fr',
          first_name: 'Admin',
          last_name: 'GasyWay',
          role: 'admin',
          first_login_completed: true
        })

      console.log('Utilisateur admin créé avec succès')
    } else if (!adminError) {
      console.log('Utilisateur admin existe déjà')
    }

    // Créer l'utilisateur voyageur
    const travelerEmail = 'voyageur@gasyway.mg'
    const { data: travelerData, error: travelerError } = await supabase.auth.admin.createUser({
      email: travelerEmail,
      password: 'voyageur123',
      user_metadata: { 
        first_name: 'Marie', 
        last_name: 'Rakoto' 
      },
      email_confirm: true
    })

    if (!travelerError && travelerData.user) {
      const travelerUserId = travelerData.user.id
      
      // Créer les données voyageur dans Supabase
      await supabase
        .from('users')
        .upsert({
          id: travelerUserId,
          email: travelerEmail,
          status: 'active',
          gdpr_consent: true,
          locale: 'fr',
          first_name: 'Marie',
          last_name: 'Rakoto',
          role: 'traveler',
          first_login_completed: true
        })

      console.log('Utilisateur voyageur créé avec succès')
    } else if (!travelerError) {
      console.log('Utilisateur voyageur existe déjà')
    }

    return {
      success: true,
      message: 'Utilisateurs de démo initialisés'
    }

  } catch (error) {
    console.error('Erreur initialisation utilisateurs démo:', error)
    return {
      success: false,
      error: error.message
    }
  }
}