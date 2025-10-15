/**
 * Gestion des centres d'intérêt depuis les tables PostgreSQL de Supabase
 * Remplace l'ancien système KV store par des requêtes directes aux tables
 */

import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const app = new Hono()

// Middleware CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Client Supabase pour les requêtes PostgreSQL
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

/**
 * Types pour les centres d'intérêt (adaptés à la structure PostgreSQL)
 */
interface Interest {
  id: string
  name: string
  description: string
  icon: string
  category: string
  active: boolean
  created_at: string
  updated_at: string
}

interface UserInterest {
  user_id: string
  interest_id: string
  created_at: string
}

/**
 * Initialisation des centres d'intérêt par défaut dans PostgreSQL
 */
export async function initializeInterests(): Promise<{ success: boolean; message: string; interests?: Interest[] }> {
  try {
    console.log('🔍 Vérification des centres d\'intérêt existants dans PostgreSQL...')
    
    // Vérifier si les centres d'intérêt existent déjà dans la table PostgreSQL
    const { data: existingInterests, error: checkError } = await supabase
      .from('interests')
      .select('*')
      .eq('active', true)
    
    if (checkError) {
      console.error('❌ Erreur lors de la vérification des centres d\'intérêt:', checkError)
      return { 
        success: false, 
        message: `Erreur PostgreSQL: ${checkError.message}` 
      }
    }
    
    if (existingInterests && existingInterests.length > 0) {
      console.log(`✅ ${existingInterests.length} centres d'intérêt déjà présents dans PostgreSQL`)
      return { 
        success: true, 
        message: 'Centres d\'intérêt déjà initialisés',
        interests: existingInterests
      }
    }

    console.log('📝 Insertion des centres d\'intérêt par défaut...')

    // Centres d'intérêt par défaut pour Madagascar
    const defaultInterests = [
      {
        name: 'Repas traditionnel chez l\'habitant',
        description: 'Goûtez la chaleur de l\'accueil malgache.',
        icon: '🍴',
        category: 'Gastronomie',
        active: true
      },
      {
        name: 'Atelier artisanal',
        description: 'Initiez-vous au tissage ou à la sculpture.',
        icon: '🎨',
        category: 'Artisanat',
        active: true
      },
      {
        name: 'Immersion villageoise',
        description: 'Deux jours au rythme d\'une communauté.',
        icon: '🌄',
        category: 'Culture',
        active: true
      },
      {
        name: 'Trek écoresponsable',
        description: 'Découvrez les paysages hors sentiers battus.',
        icon: '🥾',
        category: 'Nature',
        active: true
      },
      {
        name: 'Cacao & vanille',
        description: 'Plongez dans l\'art de la culture durable.',
        icon: '🍫',
        category: 'Agriculture',
        active: true
      },
      {
        name: 'Bivouac sous les étoiles',
        description: 'Nuit authentique en pleine nature sauvage.',
        icon: '🏕️',
        category: 'Nature',
        active: true
      },
      {
        name: 'Birdwatching au lever du soleil',
        description: 'Observation des espèces endémiques.',
        icon: '🦅',
        category: 'Nature',
        active: true
      },
      {
        name: 'Trail en forêt primaire',
        description: 'Sentiers secrets de Madagascar.',
        icon: '🚶',
        category: 'Nature',
        active: true
      },
      {
        name: 'Aventure en 4x4',
        description: 'Explorez les routes de brousse.',
        icon: '🏔️',
        category: 'Aventure',
        active: true
      },
      {
        name: 'Découverte culturelle',
        description: 'Rencontrez les traditions malgaches.',
        icon: '🏛️',
        category: 'Culture',
        active: true
      },
      {
        name: 'Écotourisme et nature',
        description: 'Préservez tout en découvrant.',
        icon: '🌿',
        category: 'Nature',
        active: true
      },
      {
        name: 'Détente en bord de mer',
        description: 'Relaxez-vous sur les plages paradisiaques.',
        icon: '🏖️',
        category: 'Plage',
        active: true
      }
    ]

    // Insérer les centres d'intérêt dans PostgreSQL
    const { data: insertedInterests, error: insertError } = await supabase
      .from('interests')
      .insert(defaultInterests)
      .select('*')

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des centres d\'intérêt:', insertError)
      return { 
        success: false, 
        message: `Erreur insertion PostgreSQL: ${insertError.message}` 
      }
    }

    console.log(`✅ ${insertedInterests?.length || 0} centres d'intérêt créés dans PostgreSQL`)

    return { 
      success: true, 
      message: `${insertedInterests?.length || 0} centres d'intérêt créés`,
      interests: insertedInterests || []
    }
  } catch (error) {
    console.error('💥 Erreur initialisation centres d\'intérêt:', error)
    return { 
      success: false, 
      message: `Erreur: ${error}` 
    }
  }
}

/**
 * ROUTES POUR LES CENTRES D'INTÉRÊT
 */

// Récupérer tous les centres d'intérêt actifs depuis PostgreSQL
app.get('/interests', async (c) => {
  try {
    console.log('📡 Récupération des centres d\'intérêt depuis PostgreSQL...')
    
    const { data: interests, error } = await supabase
      .from('interests')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) {
      console.error('❌ Erreur PostgreSQL lors de la récupération des centres d\'intérêt:', error)
      return c.json({ error: `Erreur PostgreSQL: ${error.message}` }, 500)
    }

    if (!interests || interests.length === 0) {
      console.log('⚠️ Aucun centre d\'intérêt trouvé, tentative d\'initialisation...')
      
      // Tenter d'initialiser les centres d'intérêt
      const initResult = await initializeInterests()
      if (initResult.success && initResult.interests) {
        console.log(`✅ ${initResult.interests.length} centres d'intérêt initialisés`)
        return c.json(initResult.interests)
      } else {
        console.error('❌ Échec de l\'initialisation des centres d\'intérêt')
        return c.json({ error: 'Aucun centre d\'intérêt disponible et impossible d\'initialiser' }, 404)
      }
    }

    console.log(`✅ ${interests.length} centres d'intérêt récupérés depuis PostgreSQL`)
    return c.json(interests)
  } catch (error) {
    console.error('💥 Erreur récupération centres d\'intérêt:', error)
    return c.json({ error: `Erreur serveur: ${error}` }, 500)
  }
})

// Récupérer les centres d'intérêt d'un utilisateur depuis PostgreSQL
app.get('/users/:userId/interests', async (c) => {
  try {
    const userId = c.req.param('userId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    // Vérifier l'authentification
    if (!accessToken) {
      return c.json({ error: 'Token d\'accès requis' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return c.json({ error: 'Token invalide' }, 401)
    }

    // Vérifier que l'utilisateur accède à ses propres données
    if (user.id !== userId) {
      return c.json({ error: 'Accès refusé' }, 403)
    }

    console.log(`📡 Récupération des centres d'intérêt pour l'utilisateur ${userId} depuis PostgreSQL...`)

    // Récupérer les centres d'intérêt de l'utilisateur depuis la table de liaison
    const { data: userInterests, error } = await supabase
      .from('user_interests')
      .select(`
        interest_id,
        interests (
          id,
          name,
          description,
          icon,
          category,
          active
        )
      `)
      .eq('user_id', userId)
    
    if (error) {
      console.error('❌ Erreur PostgreSQL récupération centres d\'intérêt utilisateur:', error)
      return c.json({ error: `Erreur PostgreSQL: ${error.message}` }, 500)
    }

    const interestIds = userInterests?.map(ui => ui.interest_id) || []
    console.log(`✅ ${interestIds.length} centres d'intérêt trouvés pour l'utilisateur ${userId}`)

    return c.json(interestIds)
  } catch (error) {
    console.error('💥 Erreur récupération centres d\'intérêt utilisateur:', error)
    return c.json({ error: `Erreur serveur: ${error}` }, 500)
  }
})

// Mettre à jour les centres d'intérêt d'un utilisateur dans PostgreSQL
app.put('/users/:userId/interests', async (c) => {
  try {
    const userId = c.req.param('userId')
    const { interestIds } = await c.req.json()
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    // Vérifier l'authentification
    if (!accessToken) {
      return c.json({ error: 'Token d\'accès requis' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return c.json({ error: 'Token invalide' }, 401)
    }

    // Vérifier que l'utilisateur modifie ses propres données
    if (user.id !== userId) {
      return c.json({ error: 'Accès refusé' }, 403)
    }

    // Validation des IDs de centres d'intérêt
    if (!Array.isArray(interestIds)) {
      return c.json({ error: 'interestIds doit être un tableau' }, 400)
    }

    console.log(`📡 Mise à jour des centres d'intérêt pour l'utilisateur ${userId}...`)

    // Vérifier que tous les centres d'intérêt existent
    if (interestIds.length > 0) {
      const { data: existingInterests, error: checkError } = await supabase
        .from('interests')
        .select('id')
        .in('id', interestIds)
        .eq('active', true)
      
      if (checkError) {
        return c.json({ error: `Erreur vérification: ${checkError.message}` }, 500)
      }

      if (existingInterests?.length !== interestIds.length) {
        return c.json({ error: 'Un ou plusieurs centres d\'intérêt sont invalides' }, 400)
      }
    }

    // Supprimer les anciens centres d'intérêt de l'utilisateur
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('❌ Erreur suppression anciennes associations:', deleteError)
      return c.json({ error: `Erreur suppression: ${deleteError.message}` }, 500)
    }

    // Insérer les nouveaux centres d'intérêt
    if (interestIds.length > 0) {
      const userInterestsData = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }))

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(userInterestsData)
      
      if (insertError) {
        console.error('❌ Erreur insertion nouvelles associations:', insertError)
        return c.json({ error: `Erreur insertion: ${insertError.message}` }, 500)
      }
    }

    console.log(`✅ Centres d'intérêt mis à jour pour l'utilisateur ${userId}: ${interestIds.length} associations`)

    return c.json({ 
      message: 'Centres d\'intérêt mis à jour',
      interestIds 
    })
  } catch (error) {
    console.error('💥 Erreur mise à jour centres d\'intérêt:', error)
    return c.json({ error: `Erreur serveur: ${error}` }, 500)
  }
})

// Ajouter un centre d'intérêt pour un utilisateur dans PostgreSQL
app.post('/users/:userId/interests/:interestId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const interestId = c.req.param('interestId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    // Vérifier l'authentification
    if (!accessToken) {
      return c.json({ error: 'Token d\'accès requis' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return c.json({ error: 'Token invalide' }, 401)
    }

    if (user.id !== userId) {
      return c.json({ error: 'Accès refusé' }, 403)
    }

    // Vérifier que le centre d'intérêt existe
    const { data: interest, error: checkError } = await supabase
      .from('interests')
      .select('id')
      .eq('id', interestId)
      .eq('active', true)
      .single()
    
    if (checkError || !interest) {
      return c.json({ error: 'Centre d\'intérêt non trouvé' }, 404)
    }

    // Insérer l'association (upsert pour éviter les doublons)
    const { error: insertError } = await supabase
      .from('user_interests')
      .upsert({ 
        user_id: userId, 
        interest_id: interestId 
      }, { 
        onConflict: 'user_id,interest_id' 
      })
    
    if (insertError) {
      console.error('❌ Erreur ajout centre d\'intérêt:', insertError)
      return c.json({ error: `Erreur ajout: ${insertError.message}` }, 500)
    }

    // Récupérer la liste mise à jour
    const { data: updatedInterests } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', userId)

    const interestIds = updatedInterests?.map(ui => ui.interest_id) || []

    return c.json({ 
      message: 'Centre d\'intérêt ajouté',
      interestIds 
    })
  } catch (error) {
    console.error('💥 Erreur ajout centre d\'intérêt:', error)
    return c.json({ error: `Erreur serveur: ${error}` }, 500)
  }
})

// Supprimer un centre d'intérêt pour un utilisateur dans PostgreSQL
app.delete('/users/:userId/interests/:interestId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const interestId = c.req.param('interestId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]

    // Vérifier l'authentification
    if (!accessToken) {
      return c.json({ error: 'Token d\'accès requis' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return c.json({ error: 'Token invalide' }, 401)
    }

    if (user.id !== userId) {
      return c.json({ error: 'Accès refusé' }, 403)
    }

    // Supprimer l'association
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
      .eq('interest_id', interestId)
    
    if (deleteError) {
      console.error('❌ Erreur suppression centre d\'intérêt:', deleteError)
      return c.json({ error: `Erreur suppression: ${deleteError.message}` }, 500)
    }

    // Récupérer la liste mise à jour
    const { data: updatedInterests } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', userId)

    const interestIds = updatedInterests?.map(ui => ui.interest_id) || []

    return c.json({ 
      message: 'Centre d\'intérêt supprimé',
      interestIds 
    })
  } catch (error) {
    console.error('💥 Erreur suppression centre d\'intérêt:', error)
    return c.json({ error: `Erreur serveur: ${error}` }, 500)
  }
})

export default app