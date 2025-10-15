import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { signupUser, getUserProfile, updateUserProfile, checkUserAccess, initializeDemoUsers } from './auth.ts'
import { initializePacksData, getAllPacks, getActivePacks, getPackById, createPack, updatePack, deletePack, getAllCategories } from './packs.ts'
import { getAllRegions, getRegionById, createRegion, updateRegion, deleteRegion, initializeRegions } from './regions.ts'
import { initializeDatabase } from './init-database.ts'
import validationApp from './validation.ts'
import interestsApp, { initializeInterests } from './interests.ts'
import adminAccountsApp from './admin-accounts.ts'
import { analyzeAuthSync, fixMissingUser, fixRoleMismatch, removeOrphanedUser, fixAllIssues, createAutoSyncTrigger } from './auth-sync.ts'
import { getFAQsByPack, getFAQsByInterest, getAllFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs, getFAQStats, getGeneralFAQs } from './faqs.ts'
import { 
  getAllDesignTokens, 
  getActiveDesignToken, 
  getDefaultDesignToken, 
  createDesignToken, 
  updateDesignToken, 
  activateDesignToken, 
  setDefaultDesignToken, 
  deleteDesignToken, 
  duplicateDesignToken, 
  generateCSSFromTokens 
} from './design-tokens.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import designChecker from './design-checker.ts'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}))

app.use('*', logger(console.log))

// Monter les routes de validation
app.route('/make-server-3aa6b185', validationApp)

// Monter les routes des centres d'intérêt
app.route('/make-server-3aa6b185', interestsApp)

// Monter les routes des comptes admin
app.route('/make-server-3aa6b185/admin', adminAccountsApp)

// Monter les routes du vérificateur de design system
app.route('/make-server-3aa6b185', designChecker)

// Client Supabase pour les opérations qui nécessitent encore l'API
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Health check
app.get('/make-server-3aa6b185/health', (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'GasyWay API Server',
    version: '1.0.0' 
  })
})

// Route de statut des utilisateurs de démo pour le diagnostic
app.get('/make-server-3aa6b185/auth/demo-status', async (c) => {
  try {
    // Vérifier directement dans Supabase au lieu du KV store
    const { data: users, error } = await supabase
      .from('users')
      .select('email, role')
      .in('email', ['admin@gasyway.mg', 'voyageur@gasyway.mg'])

    if (error) {
      console.error('Error checking demo users:', error)
      return c.json({ 
        available: false, 
        error: error.message 
      }, 500)
    }

    const adminUser = users?.find(u => u.email === 'admin@gasyway.mg')
    const travelerUser = users?.find(u => u.email === 'voyageur@gasyway.mg')
    
    return c.json({
      available: !!(adminUser && travelerUser),
      admin: !!adminUser,
      traveler: !!travelerUser,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking demo users status:', error)
    return c.json({ 
      available: false, 
      error: error.message 
    }, 500)
  }
})

// Initialize database with demo data
app.post('/make-server-3aa6b185/init', async (c) => {
  try {
    console.log('Initializing GasyWay database...')
    const dbResult = await initializeDatabase()
    const packsResult = await initializePacksData()
    const interestsResult = await initializeInterests()
    const regionsResult = await initializeRegions()
    const usersResult = await initializeDemoUsers()
    
    // Initialiser la table design_tokens si elle n'existe pas
    try {
      const { error: designTokensError } = await supabase.rpc('create_design_tokens_table')
      if (designTokensError && !designTokensError.message.includes('already exists')) {
        console.log('ⓘ Note: Table design_tokens peut nécessiter une création manuelle')
      } else {
        console.log('✅ Table design_tokens vérifiée/créée')
      }
    } catch (error) {
      console.log('ⓘ Note: Table design_tokens peut nécessiter une création manuelle')
    }
    
    return c.json({ 
      success: true, 
      database: dbResult,
      packs: packsResult,
      interests: interestsResult,
      regions: regionsResult,
      users: usersResult,
      message: 'Base de données GasyWay initialisée avec les données de démo'
    })
  } catch (error) {
    console.error('Error initializing:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Auth routes
app.post('/make-server-3aa6b185/auth/signup', async (c) => {
  try {
    const { email, password, firstName, lastName } = await c.req.json()
    
    if (!email || !password || !firstName || !lastName) {
      return c.json({ error: 'Tous les champs sont requis' }, 400)
    }

    const result = await signupUser(email, password, firstName, lastName)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ 
      message: 'Utilisateur créé avec succès', 
      user_id: result.user.id,
      email: result.user.email,
      role: result.user.profile.role 
    })
  } catch (error) {
    console.error('Error signup:', error)
    return c.json({ error: 'Erreur lors de la création du compte' }, 500)
  }
})

// Route pour récupérer le profil de l'utilisateur connecté
app.get('/make-server-3aa6b185/auth/profile', async (c) => {
  try {
    console.log('=== GET PROFILE REQUEST ===')
    const authHeader = c.req.header('Authorization')
    console.log('🔍 Auth header:', authHeader ? 'présent' : 'absent')
    
    const accessToken = authHeader?.split(' ')[1]
    
    if (!accessToken) {
      console.log('❌ Token manquant dans l\'en-tête Authorization')
      return c.json({ 
        error: 'Token d\'accès requis',
        details: 'En-tête Authorization manquant ou malformé'
      }, 401)
    }

    console.log('📋 Token récupéré - Longueur:', accessToken.length, 'caractères')
    console.log('📋 Début du token:', accessToken.substring(0, 20) + '...')

    const checkResult = await checkUserAccess(accessToken)
    const { authorized, user, blocked, error: authError, shouldRefresh } = checkResult
    
    console.log('📋 Résultat checkUserAccess:', { 
      authorized, 
      blocked, 
      userExists: !!user, 
      authError,
      shouldRefresh 
    })
    
    if (!authorized) {
      console.log('❌ Utilisateur non autorisé:', authError)
      
      // Retourner un code d'erreur plus spécifique selon le type d'erreur
      if (shouldRefresh || authError?.includes('Session expirée') || authError?.includes('Token expiré')) {
        return c.json({ 
          error: 'Session expirée', 
          details: authError || 'Token d\'accès expiré',
          shouldRefresh: true 
        }, 401)
      }
      
      return c.json({ 
        error: authError || 'Token invalide',
        details: 'Authentification échouée'
      }, 401)
    }

    if (blocked) {
      console.log('⚠️ Utilisateur bloqué')
      return c.json({ 
        error: 'Compte bloqué', 
        details: 'Votre compte a été bloqué par un administrateur' 
      }, 403)
    }

    if (!user) {
      console.log('❌ Utilisateur non trouvé après validation')
      return c.json({ 
        error: 'Utilisateur non trouvé',
        details: 'Profil utilisateur introuvable dans la base de données'
      }, 404)
    }

    console.log('✅ Profil récupéré avec succès pour:', user.profile.first_name, user.profile.last_name, `(${user.profile.role})`)
    
    return c.json({
      profile: user.profile,
      status: user.user.status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💥 Error get current profile:', error)
    return c.json({ 
      error: 'Erreur serveur', 
      details: error.message || 'Erreur interne du serveur',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

app.get('/make-server-3aa6b185/auth/profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.id !== userId) {
      return c.json({ error: 'Non autorisé' }, 403)
    }

    const profile = await getUserProfile(userId)
    
    if (!profile) {
      return c.json({ error: 'Profil non trouvé' }, 404)
    }

    return c.json(profile)
  } catch (error) {
    console.error('Error get profile:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Mettre à jour le profil utilisateur
app.put('/make-server-3aa6b185/auth/profile/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const profileUpdates = await c.req.json()

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || !user) {
      return c.json({ error: 'Non autorisé' }, 403)
    }

    // Mettre à jour le profil dans Supabase
    const result = await updateUserProfile(user.id, profileUpdates)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ 
      message: 'Profil mis à jour avec succès',
      profile: result.profile
    })
  } catch (error) {
    console.error('Error update profile:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Categories routes
app.get('/make-server-3aa6b185/categories', async (c) => {
  try {
    const result = await getAllCategories()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.categories)
  } catch (error) {
    console.error('Error get categories:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Regions routes
app.get('/make-server-3aa6b185/regions', async (c) => {
  try {
    const result = await getAllRegions()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.regions)
  } catch (error) {
    console.error('Error get regions:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.get('/make-server-3aa6b185/regions/:id', async (c) => {
  try {
    const regionId = c.req.param('id')
    const result = await getRegionById(regionId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 404)
    }

    return c.json(result.region)
  } catch (error) {
    console.error('Error get region:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Admin regions routes
app.get('/make-server-3aa6b185/admin/regions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await getAllRegions()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.regions)
  } catch (error) {
    console.error('Error get admin regions:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.post('/make-server-3aa6b185/admin/regions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const regionData = await c.req.json()
    const result = await createRegion(regionData)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.region)
  } catch (error) {
    console.error('Error create region:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.put('/make-server-3aa6b185/admin/regions/:id', async (c) => {
  try {
    const regionId = c.req.param('id')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const updates = await c.req.json()
    const result = await updateRegion(regionId, updates)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.region)
  } catch (error) {
    console.error('Error update region:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.delete('/make-server-3aa6b185/admin/regions/:id', async (c) => {
  try {
    const regionId = c.req.param('id')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await deleteRegion(regionId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: result.message })
  } catch (error) {
    console.error('Error delete region:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Pack routes - Public (pour les voyageurs)
app.get('/make-server-3aa6b185/packs', async (c) => {
  try {
    const result = await getActivePacks()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.packs)
  } catch (error) {
    console.error('Error get packs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.get('/make-server-3aa6b185/packs/:id', async (c) => {
  try {
    const packId = c.req.param('id')
    const result = await getPackById(packId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 404)
    }

    return c.json(result.pack)
  } catch (error) {
    console.error('Error get pack:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Reviews routes
app.get('/make-server-3aa6b185/packs/:id/reviews', async (c) => {
  try {
    const packId = c.req.param('id')
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        author:users!reviews_user_id_fkey(
          first_name,
          last_name
        ),
        moderator:users!reviews_moderated_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('pack_id', packId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching reviews:', error)
      return c.json({ error: 'Erreur lors de la récupération des avis' }, 500)
    }

    // Formater les reviews pour correspondre à l'interface Review
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      user_name: `${review.author.first_name} ${review.author.last_name.charAt(0)}.`,
      rating: review.rating,
      comment: review.comment,
      date: review.created_at.split('T')[0] // Format YYYY-MM-DD
    }))

    return c.json({ 
      success: true, 
      reviews: formattedReviews 
    })
  } catch (error) {
    console.error('Error get pack reviews:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Route POST pour créer un avis
app.post('/make-server-3aa6b185/packs/:id/reviews', async (c) => {
  try {
    const packId = c.req.param('id')
    const body = await c.req.json()
    const { rating, title, comment, user_id } = body

    // Validation des données
    if (!rating || !comment || !user_id) {
      return c.json({ error: 'Données manquantes (rating, comment, user_id requis)' }, 400)
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'La note doit être entre 1 et 5' }, 400)
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404)
    }

    // Vérifier que le pack existe
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('id, title')
      .eq('id', packId)
      .single()

    if (packError || !pack) {
      return c.json({ error: 'Pack non trouvé' }, 404)
    }

    // Vérifier si l'utilisateur a déjà donné un avis pour ce pack
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('pack_id', packId)
      .eq('user_id', user_id)
      .single()

    if (existingReview) {
      return c.json({ error: 'Vous avez déjà donné un avis pour ce pack' }, 409)
    }

    // Créer l'avis dans la table reviews (sans le champ title s'il n'existe pas)
    const reviewData = {
      pack_id: packId,
      user_id: user_id,
      rating: parseInt(rating),
      comment: comment.trim(),
      status: 'approved', // Auto-approuver les avis
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Ajouter le titre seulement s'il est fourni et non vide
    if (title && title.trim()) {
      reviewData.title = title.trim()
    }

    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating review:', insertError)
      return c.json({ error: `Erreur lors de la création de l'avis: ${insertError.message}` }, 500)
    }

    return c.json({
      success: true,
      message: 'Avis créé avec succès',
      review_id: newReview.id,
      review: {
        id: newReview.id,
        user_name: `${user.first_name} ${user.last_name.charAt(0)}.`,
        rating: newReview.rating,
        comment: newReview.comment,
        date: newReview.created_at.split('T')[0]
      }
    })

  } catch (error) {
    console.error('Error post pack review:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Admin pack routes
app.get('/make-server-3aa6b185/admin/packs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await getAllPacks()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.packs)
  } catch (error) {
    console.error('Error get admin packs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.post('/make-server-3aa6b185/admin/packs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const packData = await c.req.json()
    packData.created_by = user.id

    const result = await createPack(packData)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.pack)
  } catch (error) {
    console.error('Error create pack:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Créer un pack complet avec jours, lieux et médias
app.post('/make-server-3aa6b185/admin/packs/complete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { pack, days, media } = await c.req.json()
    
    // Ajouter l'ID de l'utilisateur créateur
    pack.created_by = user.id
    
    // Créer le pack principal dans Supabase
    const packId = crypto.randomUUID()
    const packWithId = { ...pack, id: packId }
    
    const result = await createPack(packWithId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    // Pour l'instant, on ignore les jours et médias car les tables n'existent peut-être pas encore
    // Dans le futur, on pourrait les stocker directement dans Supabase avec des tables pack_days et pack_media

    return c.json({ 
      pack: result.pack,
      days: days?.length || 0,
      media: media?.length || 0,
      message: 'Pack créé avec succès (jours et médias non gérés pour l\'instant)'
    })
  } catch (error) {
    console.error('Error create complete pack:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.put('/make-server-3aa6b185/admin/packs/:id', async (c) => {
  try {
    const packId = c.req.param('id')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const updates = await c.req.json()
    const result = await updatePack(packId, updates)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.pack)
  } catch (error) {
    console.error('Error update pack:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.delete('/make-server-3aa6b185/admin/packs/:id', async (c) => {
  try {
    const packId = c.req.param('id')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await deletePack(packId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: result.message })
  } catch (error) {
    console.error('Error delete pack:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Admin users routes
app.get('/make-server-3aa6b185/admin/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Récupérer tous les utilisateurs depuis Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erreur récupération utilisateurs: ${error.message}`)
    }

    // Formater les données pour correspondre à l'interface attendue
    const formattedUsers = users.map(user => ({
      ...user,
      profiles: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    }))

    return c.json(formattedUsers)
  } catch (error) {
    console.error('Error get admin users:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.put('/make-server-3aa6b185/admin/users/:userId/status', async (c) => {
  try {
    const userId = c.req.param('userId')
    const { status } = await c.req.json()
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Mettre à jour le statut de l'utilisateur dans Supabase
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur mise à jour statut: ${error.message}`)
    }

    return c.json({ message: 'Statut mis à jour', user: updatedUser })
  } catch (error: any) {
    console.error('Error update user status:', error)
    return c.json({ error: error.message || 'Erreur serveur' }, 500)
  }
})

app.delete('/make-server-3aa6b185/admin/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Vérifier qu'on ne supprime pas son propre compte admin
    if (userId === user.id) {
      return c.json({ error: 'Impossible de supprimer votre propre compte admin' }, 400)
    }

    // Méthode 1: Essayer de bloquer l'utilisateur au lieu de le supprimer
    // Cela évite les problèmes de contraintes et est réversible
    try {
      const { data: updatedUser, error: blockError } = await supabase
        .from('users')
        .update({ status: 'blocked' })
        .eq('id', userId)
        .select()
        .single()

      if (blockError) {
        throw blockError
      }

      // Si le blocage réussit, essayer ensuite la suppression de auth.users
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          console.log('Info: Utilisateur bloqué, mais suppression auth échouée:', authDeleteError.message)
          return c.json({ 
            message: 'Utilisateur bloqué définitivement (suppression auth échouée)',
            blocked: true,
            authDeleted: false 
          })
        }
        
        return c.json({ 
          message: 'Utilisateur supprimé complètement',
          blocked: true,
          authDeleted: true 
        })
      } catch (authError) {
        console.log('Info: Utilisateur bloqué, suppression auth non disponible')
        return c.json({ 
          message: 'Utilisateur bloqué définitivement',
          blocked: true,
          authDeleted: false 
        })
      }

    } catch (blockError) {
      // Si même le blocage échoue, essayer une suppression directe
      console.log('Erreur blocage:', blockError)
      
      try {
        // Suppression directe sans modification de status
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) {
          throw new Error(`Suppression échouée: ${deleteError.message}`)
        }

        return c.json({ message: 'Utilisateur supprimé directement' })
      } catch (deleteError) {
        throw new Error(`Impossible de supprimer ou bloquer l'utilisateur: ${deleteError.message}`)
      }
    }

  } catch (error: any) {
    console.error('Error delete user:', error)
    return c.json({ error: error.message || 'Erreur serveur' }, 500)
  }
})

// Admin stats
app.get('/make-server-3aa6b185/admin/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Récupérer les statistiques depuis Supabase et KV store
    const allPacks = await getAllPacks()
    const activePacks = await getActivePacks()
    
    // Compter les utilisateurs actifs depuis Supabase
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, status')

    const activeUsersCount = users ? users.filter(user => user.status === 'active').length : 0

    const stats = {
      totalUsers: activeUsersCount,
      totalPacks: allPacks.success ? allPacks.packs.length : 0,
      activePacks: activePacks.success ? activePacks.packs.length : 0,
      totalBookings: 0, // À implémenter plus tard
      totalRevenue: 0 // À implémenter plus tard
    }

    return c.json(stats)
  } catch (error) {
    console.error('Error stats admin:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Upload routes (utilise encore Supabase Storage)
app.post('/make-server-3aa6b185/upload/avatar', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token d\'accès requis' }, 401)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !user) {
      return c.json({ error: 'Token invalide' }, 401)
    }

    const formData = await c.req.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return c.json({ error: 'Fichier requis' }, 400)
    }

    // Créer le bucket avatars s'il n'existe pas
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === 'make-3aa6b185-avatars')
    
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('make-3aa6b185-avatars', {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      })
      if (bucketError) {
        console.log('Erreur création bucket:', bucketError)
      }
    }

    // Upload du fichier
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('make-3aa6b185-avatars')
      .upload(fileName, file, { 
        cacheControl: '3600',
        upsert: false 
      })

    if (error) {
      console.log('Erreur upload avatar:', error)
      return c.json({ error: 'Erreur lors de l\'upload' }, 500)
    }

    // Générer l'URL signée
    const { data: urlData, error: urlError } = await supabase.storage
      .from('make-3aa6b185-avatars')
      .createSignedUrl(fileName, 3600 * 24 * 365) // 1 an

    if (urlError) {
      console.log('Erreur génération URL:', urlError)
      return c.json({ error: 'Erreur génération URL' }, 500)
    }

    return c.json({ url: urlData.signedUrl, path: fileName })
  } catch (error) {
    console.log('Erreur upload avatar:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES FAQ - Liées aux centres d'intérêt
// =====================================================

// FAQ publiques d'un pack (via ses centres d'intérêt)
app.get('/make-server-3aa6b185/packs/:packId/faqs', async (c) => {
  try {
    const packId = c.req.param('packId')
    const result = await getFAQsByPack(packId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json({
      faqs: result.faqs,
      total: result.total || 0
    })
  } catch (error) {
    console.error('Error get pack FAQs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// FAQ publiques d'un centre d'intérêt
app.get('/make-server-3aa6b185/interests/:interestId/faqs', async (c) => {
  try {
    const interestId = c.req.param('interestId')
    const result = await getFAQsByInterest(interestId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.faqs)
  } catch (error) {
    console.error('Error get interest FAQs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// FAQ générales
app.get('/make-server-3aa6b185/faqs', async (c) => {
  try {
    const result = await getGeneralFAQs()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.faqs)
  } catch (error) {
    console.error('Error get general FAQs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES DESIGN TOKENS
// =====================================================

// Route publique pour récupérer les design tokens actifs (pour le chargement initial)
app.get('/make-server-3aa6b185/design-tokens/active', async (c) => {
  try {
    // Essayer de récupérer le token actif
    const activeResult = await getActiveDesignToken()
    
    if (activeResult.success) {
      return c.json({
        success: true,
        tokens: activeResult.token.tokens
      })
    }

    // Si pas de token actif, essayer le par défaut
    const defaultResult = await getDefaultDesignToken()
    
    if (defaultResult.success) {
      return c.json({
        success: true,
        tokens: defaultResult.token.tokens
      })
    }

    // Aucun token trouvé - retourner une réponse vide pour permettre l'utilisation des valeurs par défaut
    return c.json({
      success: false,
      error: 'Aucun design token configuré'
    }, 404)

  } catch (error) {
    console.error('Error get active design tokens:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    }, 500)
  }
})

// Récupérer le thème actuel/par défaut pour l'éditeur
app.get('/make-server-3aa6b185/admin/design-tokens/current', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Essayer de récupérer le token actif, sinon le par défaut
    const activeResult = await getActiveDesignToken()
    
    if (activeResult.success) {
      return c.json({
        success: true,
        tokens: activeResult.token.tokens,
        meta: {
          id: activeResult.token.id,
          name: activeResult.token.name,
          is_active: activeResult.token.is_active,
          is_default: activeResult.token.is_default
        }
      })
    }

    // Si pas de token actif, essayer le par défaut
    const defaultResult = await getDefaultDesignToken()
    
    if (defaultResult.success) {
      return c.json({
        success: true,
        tokens: defaultResult.token.tokens,
        meta: {
          id: defaultResult.token.id,
          name: defaultResult.token.name,
          is_active: defaultResult.token.is_active,
          is_default: defaultResult.token.is_default
        }
      })
    }

    // Aucun token trouvé
    return c.json({
      success: false,
      error: 'Aucun design token trouvé'
    }, 404)

  } catch (error) {
    console.error('Error get current design tokens:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    }, 500)
  }
})

// Mettre à jour/créer le thème unique
app.put('/make-server-3aa6b185/admin/design-tokens/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { tokens } = await c.req.json()
    
    if (!tokens) {
      return c.json({ 
        success: false,
        error: 'Tokens requis' 
      }, 400)
    }

    // Chercher s'il existe un token actif ou par défaut
    const activeResult = await getActiveDesignToken()
    const defaultResult = await getDefaultDesignToken()
    
    let targetToken = null
    
    if (activeResult.success) {
      targetToken = activeResult.token
    } else if (defaultResult.success) {
      targetToken = defaultResult.token
    }

    if (targetToken) {
      // Mettre à jour le token existant
      const updateResult = await updateDesignToken(targetToken.id, { tokens })
      
      if (updateResult.success) {
        return c.json({
          success: true,
          message: 'Design tokens mis à jour avec succès',
          token: updateResult.token
        })
      } else {
        return c.json({ 
          success: false,
          error: updateResult.error 
        }, 500)
      }
    } else {
      // Créer un nouveau token par défaut
      const createResult = await createDesignToken(
        'Thème GasyWay',
        tokens,
        'Thème principal de GasyWay',
        user.id
      )
      
      if (createResult.success) {
        // L'activer et le marquer comme par défaut
        await activateDesignToken(createResult.token.id)
        await setDefaultDesignToken(createResult.token.id)
        
        return c.json({
          success: true,
          message: 'Design tokens créés avec succès',
          token: createResult.token
        })
      } else {
        return c.json({ 
          success: false,
          error: createResult.error 
        }, 500)
      }
    }

  } catch (error) {
    console.error('Error update design tokens:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    }, 500)
  }
})

// Nettoyer les doublons dans design_tokens
app.post('/make-server-3aa6b185/admin/design-tokens/cleanup', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Récupérer tous les tokens avec des noms similaires
    const { data: allTokens, error: fetchError } = await supabase
      .from('design_tokens')
      .select('id, name, is_active, is_default, created_at')
      .order('created_at', { ascending: true })

    if (fetchError) {
      return c.json({ 
        success: false,
        error: 'Erreur lors de la récupération des tokens',
        details: fetchError.message
      }, 500)
    }

    console.log(`🔍 Analyse de ${allTokens.length} tokens pour doublons`)

    // Étape 1: Corriger les is_default multiples
    const defaultTokens = allTokens.filter(token => token.is_default === true)
    
    if (defaultTokens.length > 1) {
      console.log(`⚠️ ${defaultTokens.length} tokens par défaut trouvés, correction en cours...`)
      
      // Garder le plus ancien comme par défaut, retirer le flag des autres
      const oldestDefault = defaultTokens.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
      const duplicateDefaults = defaultTokens.filter(t => t.id !== oldestDefault.id)
      
      for (const token of duplicateDefaults) {
        await supabase
          .from('design_tokens')
          .update({ is_default: false, is_active: false })
          .eq('id', token.id)
      }
      
      console.log(`✅ ${duplicateDefaults.length} tokens par défaut dupliqués corrigés`)
    }

    // Étape 2: Identifier et supprimer les doublons de noms
    const nameGroups = allTokens.reduce((groups, token) => {
      const baseName = token.name.toLowerCase().trim()
      if (!groups[baseName]) groups[baseName] = []
      groups[baseName].push(token)
      return groups
    }, {})

    let totalDeleted = 0
    const deletedTokens = []

    for (const [name, tokens] of Object.entries(nameGroups)) {
      if (tokens.length > 1) {
        console.log(`🔍 Doublon détecté pour "${name}": ${tokens.length} occurrences`)
        
        // Garder le plus ancien, supprimer les autres
        const sorted = tokens.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        const toKeep = sorted[0]
        const toDelete = sorted.slice(1)
        
        for (const token of toDelete) {
          const { error } = await supabase
            .from('design_tokens')
            .delete()
            .eq('id', token.id)
            
          if (!error) {
            deletedTokens.push({ id: token.id, name: token.name })
            totalDeleted++
          }
        }
        
        console.log(`✅ Conservé: "${toKeep.name}" (${toKeep.id}), supprimé ${toDelete.length} doublons`)
      }
    }

    return c.json({
      success: true,
      message: totalDeleted > 0 
        ? `${totalDeleted} doublons supprimés avec succès` 
        : 'Aucun doublon détecté',
      defaultTokensFixed: defaultTokens.length > 1 ? defaultTokens.length - 1 : 0,
      duplicatesDeleted: totalDeleted,
      details: deletedTokens,
      remainingTokens: allTokens.length - totalDeleted
    })

  } catch (error) {
    console.error('Error cleanup design tokens:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    }, 500)
  }
})

// Test de connectivité pour les design tokens avec diagnostic complet
app.get('/make-server-3aa6b185/admin/design-tokens/test', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: 'Token manquant',
        debug: 'Aucun token d\'authentification fourni' 
      }, 401)
    }

    console.log('🔍 Test design tokens - Token présent, longueur:', accessToken.length)

    const { authorized, user, blocked, error: authError } = await checkUserAccess(accessToken)
    
    if (!authorized) {
      return c.json({ 
        success: false,
        error: 'Non autorisé',
        debug: {
          authError,
          userExists: !!user,
          blocked
        }
      }, 403)
    }

    if (!user) {
      return c.json({ 
        success: false,
        error: 'Utilisateur non trouvé',
        debug: 'User object is null'
      }, 404)
    }

    console.log('🔍 User trouvé:', {
      id: user.id,
      email: user.user?.email,
      role: user.profile?.role
    })

    if (user.profile?.role !== 'admin') {
      return c.json({ 
        success: false,
        error: 'Accès admin requis',
        debug: {
          userRole: user.profile?.role,
          userId: user.id,
          profileExists: !!user.profile
        }
      }, 403)
    }

    // Tester l'existence de la table design_tokens
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('design_tokens')
        .select('count(*)')
        .limit(1)

      const tableExists = !testError
      
      return c.json({
        success: true,
        tableExists,
        user: {
          id: user.id,
          role: user.profile.role,
          email: user.user.email
        },
        debug: {
          testError: testError?.message,
          testQuery: testQuery
        },
        message: tableExists 
          ? 'Table design_tokens existe et accessible' 
          : 'Table design_tokens n\'existe pas - création requise'
      })
    } catch (tableError) {
      return c.json({
        success: true,
        tableExists: false,
        user: {
          id: user.id,
          role: user.profile.role,
          email: user.user.email
        },
        debug: {
          tableError: tableError.message
        },
        message: 'Table design_tokens n\'existe pas - création requise'
      })
    }

  } catch (error) {
    console.error('Error test design tokens:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      debug: error.message 
    }, 500)
  }
})

// Créer automatiquement la table design_tokens et le thème par défaut
app.post('/make-server-3aa6b185/admin/design-tokens/create-table', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Vérifier d'abord si un thème par défaut existe déjà
    const { data: existingDefault, error: checkError } = await supabase
      .from('design_tokens')
      .select('id, name')
      .eq('is_default', true)
      .limit(1)

    if (checkError && !checkError.message.includes('does not exist')) {
      // Erreur autre que "table n'existe pas"
      console.error('Erreur vérification thème par défaut:', checkError)
      return c.json({ 
        success: false,
        error: 'Erreur lors de la vérification',
        details: checkError.message
      }, 500)
    }

    if (existingDefault && existingDefault.length > 0) {
      // Un thème par défaut existe déjà
      return c.json({
        success: true,
        message: `Thème par défaut "${existingDefault[0].name}" existe déjà`,
        existing: true
      })
    }

    // Essayer d'insérer le thème par défaut
    const defaultTokens = {
      primary: '#0d4047',
      primaryForeground: '#ffffff',
      secondary: '#c6e5de',
      secondaryForeground: '#0d4047',
      accent: '#bcdc49',
      accentForeground: '#0d4047',
      background: '#ffffff',
      foreground: '#0d4047',
      muted: '#ececf0',
      mutedForeground: '#717182',
      destructive: '#d4183d',
      destructiveForeground: '#ffffff',
      border: 'rgba(0, 0, 0, 0.1)',
      fontFamily: 'Outfit',
      fontSize: 16,
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      h1: { fontSize: 24, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      h2: { fontSize: 20, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      h3: { fontSize: 18, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      h4: { fontSize: 16, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      h5: { fontSize: 14, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      h6: { fontSize: 12, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      p: { fontSize: 16, lineHeight: 1.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
      label: { fontSize: 16, lineHeight: 1.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      radiusBase: 10,
      spacingBase: 16
    }

    // Générer un nom unique avec timestamp
    const defaultName = `Thème GasyWay par défaut ${new Date().getTime()}`
    
    const { data: insertedToken, error: insertError } = await supabase
      .from('design_tokens')
      .insert({
        name: defaultName,
        description: 'Thème officiel de GasyWay avec les couleurs et styles de la marque',
        tokens: defaultTokens,
        is_active: true,
        is_default: true,
        created_by: user.id
      })
      .select()

    if (insertError) {
      console.error('Erreur insertion thème par défaut:', insertError)
      
      if (insertError.message.includes('does not exist')) {
        return c.json({ 
          success: false,
          error: 'La table design_tokens doit être créée manuellement via SQL',
          details: insertError.message,
          sqlScript: '/sql/create_design_tokens_simple.sql',
          instruction: 'Exécutez le script SQL dans votre console Supabase'
        })
      }

      if (insertError.message.includes('duplicate key')) {
        return c.json({ 
          success: false,
          error: 'Un thème avec ce nom existe déjà',
          details: insertError.message,
          suggestion: 'Utilisez le bouton Test pour vérifier l\'état'
        })
      }

      return c.json({ 
        success: false,
        error: 'Erreur lors de l\'insertion du thème',
        details: insertError.message
      }, 500)
    }

    return c.json({
      success: true,
      message: 'Thème par défaut créé avec succès',
      tokenId: insertedToken?.[0]?.id,
      tokenName: defaultName
    })

  } catch (error) {
    console.error('Error create design tokens table:', error)
    return c.json({ 
      success: false,
      error: 'Erreur serveur',
      details: error.message 
    }, 500)
  }
})

// Récupérer le thème actif (public)
app.get('/make-server-3aa6b185/design-tokens/active', async (c) => {
  try {
    const result = await getActiveDesignToken()
    
    if (!result.success) {
      // Si pas de thème actif, retourner les valeurs par défaut
      return c.json({ 
        success: true, 
        token: null,
        tokens: null,
        message: 'Aucun thème actif configuré - utilisation des valeurs par défaut' 
      })
    }

    return c.json({
      success: true,
      id: result.token.id,
      tokens: result.token.tokens
    })
  } catch (error) {
    console.error('Error get active design token:', error)
    // En cas d'erreur (table n'existe pas), retourner des valeurs par défaut
    return c.json({ 
      success: true, 
      token: null,
      tokens: null,
      message: 'Table design_tokens non disponible - utilisation des valeurs par défaut' 
    })
  }
})

// UPDATE du thème unique
app.put('/make-server-3aa6b185/admin/design-tokens/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { tokens } = await c.req.json()
    
    if (!tokens) {
      return c.json({ error: 'Tokens manquants' }, 400)
    }

    // Chercher le thème actif/par défaut
    const { data: activeTheme, error: fetchError } = await supabase
      .from('design_tokens')
      .select('id')
      .or('is_active.eq.true,is_default.eq.true')
      .limit(1)

    if (fetchError) {
      console.error('Erreur recherche thème actif:', fetchError)
      return c.json({ error: 'Erreur lors de la recherche du thème' }, 500)
    }

    if (!activeTheme || activeTheme.length === 0) {
      return c.json({ error: 'Aucun thème trouvé. Créez d\'abord un thème.' }, 404)
    }

    // Mettre à jour le thème unique
    const { error: updateError } = await supabase
      .from('design_tokens')
      .update({
        tokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeTheme[0].id)

    if (updateError) {
      console.error('Erreur mise à jour design tokens:', updateError)
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500)
    }

    return c.json({
      success: true,
      id: activeTheme[0].id,
      message: 'Thème mis à jour avec succès'
    })
  } catch (error) {
    console.error('Error update design tokens:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Sauvegarder/Créer un thème (admin)
app.post('/make-server-3aa6b185/admin/design-tokens/save', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { tokens, currentTokenId } = await c.req.json()
    
    let result
    if (currentTokenId) {
      // Mettre à jour le thème existant
      result = await updateDesignToken(currentTokenId, { tokens })
    } else {
      // Créer un nouveau thème par défaut
      result = await createDesignToken(
        'Thème GasyWay', 
        tokens, 
        'Thème principal de GasyWay',
        user.id
      )
      
      if (result.success) {
        // Activer le nouveau thème
        await activateDesignToken(result.token.id)
        await setDefaultDesignToken(result.token.id)
      }
    }
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({
      success: true,
      message: 'Thème sauvegardé avec succès',
      id: result.token.id,
      tokens: result.token.tokens
    })
  } catch (error) {
    console.error('Error save design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Générer le CSS à partir des tokens
app.post('/make-server-3aa6b185/admin/design-tokens/generate-css', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { tokens } = await c.req.json()
    
    const css = generateCSSFromTokens(tokens)
    
    return c.json({
      success: true,
      css
    })
  } catch (error) {
    console.error('Error generate CSS:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES FAQ ADMIN
// =====================================================

// Récupérer toutes les FAQ (admin)
app.get('/make-server-3aa6b185/admin/faqs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const includeInactive = c.req.query('include_inactive') === 'true'
    const result = await getAllFAQs(includeInactive)
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.faqs)
  } catch (error) {
    console.error('Error get admin FAQs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Créer une nouvelle FAQ (admin)
app.post('/make-server-3aa6b185/admin/faqs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const faqData = await c.req.json()
    const result = await createFAQ(faqData)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.faq)
  } catch (error) {
    console.error('Error create FAQ:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Mettre à jour une FAQ (admin)
app.put('/make-server-3aa6b185/admin/faqs/:faqId', async (c) => {
  try {
    const faqId = c.req.param('faqId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const updates = await c.req.json()
    const result = await updateFAQ(faqId, updates)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.faq)
  } catch (error) {
    console.error('Error update FAQ:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Supprimer une FAQ (admin)
app.delete('/make-server-3aa6b185/admin/faqs/:faqId', async (c) => {
  try {
    const faqId = c.req.param('faqId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await deleteFAQ(faqId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: result.message })
  } catch (error) {
    console.error('Error delete FAQ:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Réorganiser les FAQ d'un centre d'intérêt (admin)
app.put('/make-server-3aa6b185/admin/interests/:interestId/faqs/reorder', async (c) => {
  try {
    const interestId = c.req.param('interestId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { faq_ids } = await c.req.json()
    const result = await reorderFAQs(interestId, faq_ids)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: result.message })
  } catch (error) {
    console.error('Error reorder FAQs:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Statistiques FAQ (admin)
app.get('/make-server-3aa6b185/admin/faqs/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await getFAQStats()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.stats)
  } catch (error) {
    console.error('Error get FAQ stats:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES DESIGN TOKENS - Gestion du design system
// =====================================================

// Récupérer le design token actif (public)
app.get('/make-server-3aa6b185/design-tokens/active', async (c) => {
  try {
    console.log('🎨 [Server] Requête GET /design-tokens/active reçue')
    const result = await getActiveDesignToken()
    
    if (!result.success) {
      console.error('❌ [Server] Aucun token actif trouvé:', result.error)
      return c.json({ success: false, error: result.error }, 404)
    }

    console.log('✅ [Server] Token actif trouvé:', result.token?.name)
    // Retourner dans le format attendu par le loader
    return c.json({ 
      success: true, 
      tokens: result.token.tokens 
    })
  } catch (error) {
    console.error('❌ [Server] Erreur get active design token:', error)
    return c.json({ success: false, error: 'Erreur serveur' }, 500)
  }
})

// Récupérer le design token par défaut (public)
app.get('/make-server-3aa6b185/design-tokens/default', async (c) => {
  try {
    const result = await getDefaultDesignToken()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.token)
  } catch (error) {
    console.error('Error get default design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Générer le CSS à partir du token actif (public)
app.get('/make-server-3aa6b185/design-tokens/css', async (c) => {
  try {
    const result = await getActiveDesignToken()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    const css = generateCSSFromTokens(result.token.tokens)
    
    return new Response(css, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error generate CSS:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES DESIGN TOKENS ADMIN
// =====================================================

// Récupérer tous les design tokens (admin)
app.get('/make-server-3aa6b185/admin/design-tokens', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const includeInactive = c.req.query('include_inactive') === 'true'
    const result = await getAllDesignTokens(includeInactive)
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.tokens)
  } catch (error) {
    console.error('Error get admin design tokens:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Créer un nouveau design token (admin)
app.post('/make-server-3aa6b185/admin/design-tokens', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { name, description, tokens } = await c.req.json()
    
    if (!name || !tokens) {
      return c.json({ error: 'Nom et tokens requis' }, 400)
    }

    const result = await createDesignToken(name, tokens, description, user.id)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.token)
  } catch (error) {
    console.error('Error create design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Mettre à jour un design token (admin)
app.put('/make-server-3aa6b185/admin/design-tokens/:tokenId', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const updates = await c.req.json()
    const result = await updateDesignToken(tokenId, updates)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.token)
  } catch (error) {
    console.error('Error update design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Activer un design token (admin)
app.put('/make-server-3aa6b185/admin/design-tokens/:tokenId/activate', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await activateDesignToken(tokenId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: 'Design token activé avec succès', token: result.token })
  } catch (error) {
    console.error('Error activate design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Marquer un design token comme par défaut (admin)
app.put('/make-server-3aa6b185/admin/design-tokens/:tokenId/set-default', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await setDefaultDesignToken(tokenId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: 'Design token défini comme par défaut', token: result.token })
  } catch (error) {
    console.error('Error set default design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Dupliquer un design token (admin)
app.post('/make-server-3aa6b185/admin/design-tokens/:tokenId/duplicate', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const { newName } = await c.req.json()
    
    if (!newName) {
      return c.json({ error: 'Nouveau nom requis' }, 400)
    }

    const result = await duplicateDesignToken(tokenId, newName, user.id)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(result.token)
  } catch (error) {
    console.error('Error duplicate design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Supprimer un design token (admin)
app.delete('/make-server-3aa6b185/admin/design-tokens/:tokenId', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await deleteDesignToken(tokenId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: result.message })
  } catch (error) {
    console.error('Error delete design token:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Générer le CSS d'un design token spécifique (admin)
app.get('/make-server-3aa6b185/admin/design-tokens/:tokenId/css', async (c) => {
  try {
    const tokenId = c.req.param('tokenId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    // Récupérer le token spécifique
    const { data: token, error } = await supabase
      .from('design_tokens')
      .select('tokens')
      .eq('id', tokenId)
      .single()

    if (error) {
      return c.json({ error: 'Design token non trouvé' }, 404)
    }

    const css = generateCSSFromTokens(token.tokens)
    
    return new Response(css, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error generate token CSS:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES AUTH SYNC - Synchronisation Auth/Users sécurisée
// =====================================================

// Analyser la synchronisation (admin)
app.get('/make-server-3aa6b185/admin/auth-sync/analyze', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await analyzeAuthSync()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json(result.analysis)
  } catch (error) {
    console.error('Error analyze auth sync:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Corriger un utilisateur manquant (admin)
app.post('/make-server-3aa6b185/admin/auth-sync/fix-missing/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await fixMissingUser(userId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: 'Utilisateur synchronisé avec succès' })
  } catch (error) {
    console.error('Error fix missing user:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Corriger un rôle incohérent (admin)
app.post('/make-server-3aa6b185/admin/auth-sync/fix-role/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await fixRoleMismatch(userId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: 'Rôle corrigé avec succès' })
  } catch (error) {
    console.error('Error fix role mismatch:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Supprimer un utilisateur orphelin (admin)
app.delete('/make-server-3aa6b185/admin/auth-sync/remove-orphan/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await removeOrphanedUser(userId)
    
    if (!result.success) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({ message: 'Utilisateur orphelin supprimé' })
  } catch (error) {
    console.error('Error remove orphaned user:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Corriger tous les problèmes automatiquement (admin)
app.post('/make-server-3aa6b185/admin/auth-sync/fix-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await fixAllIssues()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json({
      message: `Correction terminée: ${result.fixed} réparation(s)`,
      fixed: result.fixed,
      errors: result.errors
    })
  } catch (error) {
    console.error('Error fix all issues:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// Créer le trigger de synchronisation automatique (admin)
app.post('/make-server-3aa6b185/admin/auth-sync/create-trigger', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Token manquant' }, 401)
    }

    const { authorized, user } = await checkUserAccess(accessToken)
    
    if (!authorized || user?.profile.role !== 'admin') {
      return c.json({ error: 'Accès admin requis' }, 403)
    }

    const result = await createAutoSyncTrigger()
    
    if (!result.success) {
      return c.json({ error: result.error }, 500)
    }

    return c.json({ message: 'Trigger de synchronisation automatique créé avec succès' })
  } catch (error) {
    console.error('Error create auto sync trigger:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// =====================================================
// ROUTES PUBLIQUES PACKS - Avec ratings automatiques
// =====================================================

// Route pour récupérer tous les packs avec ratings (public)
app.get('/make-server-3aa6b185/packs', async (c) => {
  try {
    console.log('📦 Récupération de tous les packs avec ratings...')

    const result = await getAllPacks()
    
    if (!result.success) {
      console.error('❌ Erreur getAllPacks:', result.error)
      return c.json({ success: false, error: result.error }, 500)
    }

    console.log(`✅ ${result.packs?.length || 0} packs récupérés avec ratings`)
    return c.json({ 
      success: true, 
      packs: result.packs || [],
      message: `${result.packs?.length || 0} packs récupérés avec statistics`
    })
  } catch (error) {
    console.error('💥 Erreur route packs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Route pour récupérer les packs actifs avec ratings (public)
app.get('/make-server-3aa6b185/packs/active', async (c) => {
  try {
    console.log('📦 Récupération des packs actifs avec ratings...')

    const result = await getActivePacks()
    
    if (!result.success) {
      console.error('❌ Erreur getActivePacks:', result.error)
      return c.json({ success: false, error: result.error }, 500)
    }

    console.log(`✅ ${result.packs?.length || 0} packs actifs récupérés avec ratings`)
    return c.json({ 
      success: true, 
      packs: result.packs || [],
      message: `${result.packs?.length || 0} packs actifs récupérés avec statistics`
    })
  } catch (error) {
    console.error('💥 Erreur route packs actifs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Route pour récupérer un pack spécifique avec ratings (public)
app.get('/make-server-3aa6b185/packs/:packId', async (c) => {
  try {
    const packId = c.req.param('packId')
    console.log(`📦 Récupération du pack ${packId} avec ratings...`)

    const result = await getPackById(packId)
    
    if (!result.success) {
      console.error('❌ Erreur getPackById:', result.error)
      return c.json({ success: false, error: result.error }, 404)
    }

    console.log(`✅ Pack ${packId} récupéré avec ratings`)
    return c.json({ 
      success: true, 
      pack: result.pack,
      message: `Pack récupéré avec statistics`
    })
  } catch (error) {
    console.error('💥 Erreur route pack détail:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

console.log('GasyWay Server starting...')
Deno.serve(app.fetch)