import { supabase } from './supabase/client'

export interface InitResult {
  success: boolean
  message: string
  details?: any
}

export async function resetSQLDatabase(): Promise<InitResult> {
  try {
    console.log('🔄 Réinitialisation complète de la base de données SQL...')

    // 1. Supprimer toutes les données des tables dans l'ordre correct (pour éviter les conflits de clés étrangères)
    const tablesToClear = ['user_interests', 'profiles', 'users', 'interests']
    
    for (const table of tablesToClear) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'dummy') // Supprimer tous les enregistrements
        
        if (error) {
          console.warn(`Erreur suppression ${table}:`, error.message)
        } else {
          console.log(`✅ Table ${table} vidée`)
        }
      } catch (error: any) {
        console.warn(`Erreur suppression ${table}:`, error.message)
      }
    }

    // 2. Réinitialiser avec les données par défaut
    const initResult = await initializeSQLDatabase()
    
    return {
      success: true,
      message: 'Base de données réinitialisée avec succès',
      details: {
        ...initResult.details,
        reset: true
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    return {
      success: false,
      message: `Erreur de réinitialisation: ${error.message}`
    }
  }
}

export async function initializeSQLDatabase(): Promise<InitResult> {
  try {
    console.log('🔄 Initialisation de la base de données SQL...')

    // 1. Vérifier si les tables existent et sont accessibles
    const tablesCheck = await checkTables()
    if (!tablesCheck.success) {
      return tablesCheck
    }

    // 2. Initialiser les centres d'intérêt
    const interestsResult = await initializeInterests()
    if (!interestsResult.success) {
      return interestsResult
    }

    // 3. Créer les utilisateurs de démonstration
    const usersResult = await initializeDemoUsers()
    if (!usersResult.success) {
      return usersResult
    }

    console.log('✅ Base de données SQL initialisée avec succès')
    return {
      success: true,
      message: 'Base de données initialisée avec succès',
      details: {
        interests: interestsResult.details,
        users: usersResult.details
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    return {
      success: false,
      message: `Erreur d'initialisation: ${error.message}`
    }
  }
}

async function checkTables(): Promise<InitResult> {
  try {
    // Tester l'accès aux tables principales
    const tables = ['users', 'profiles', 'interests', 'user_interests']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        return {
          success: false,
          message: `Table '${table}' inaccessible: ${error.message}. Veuillez créer les tables via l'interface Supabase.`
        }
      }
    }

    return { success: true, message: 'Toutes les tables sont accessibles' }
  } catch (error: any) {
    return {
      success: false,
      message: `Erreur vérification tables: ${error.message}`
    }
  }
}

async function initializeInterests(): Promise<InitResult> {
  try {
    // Vérifier si des intérêts existent déjà
    const { count, error: countError } = await supabase
      .from('interests')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    if (count && count > 0) {
      return {
        success: true,
        message: 'Centres d\'intérêt déjà présents',
        details: { existing: count }
      }
    }

    // Créer les centres d'intérêt par défaut
    const defaultInterests = [
      { id: crypto.randomUUID(), name: 'Nature et Wildlife' },
      { id: crypto.randomUUID(), name: 'Culture et Histoire' },
      { id: crypto.randomUUID(), name: 'Aventure et Trekking' },
      { id: crypto.randomUUID(), name: 'Plages et Détente' },
      { id: crypto.randomUUID(), name: 'Gastronomie Locale' },
      { id: crypto.randomUUID(), name: 'Écotourisme' },
      { id: crypto.randomUUID(), name: 'Photographie' },
      { id: crypto.randomUUID(), name: 'Rencontres Locales' }
    ]

    const { error: insertError } = await supabase
      .from('interests')
      .insert(defaultInterests)

    if (insertError) throw insertError

    return {
      success: true,
      message: 'Centres d\'intérêt créés avec succès',
      details: { created: defaultInterests.length }
    }

  } catch (error: any) {
    return {
      success: false,
      message: `Erreur création intérêts: ${error.message}`
    }
  }
}

async function initializeDemoUsers(): Promise<InitResult> {
  try {
    // IDs fixes pour les utilisateurs de démonstration
    const DEMO_VOYAGEUR_ID = 'a1b2c3d4-demo-user-0001-voyageur0001'
    const DEMO_ADMIN_ID = 'a1b2c3d4-demo-user-0001-admin0000001'

    const results = []

    // 1. Insérer directement les utilisateurs avec des IDs fixes
    const demoUsers = [
      {
        id: DEMO_VOYAGEUR_ID,
        email: 'demo@voyageur.com',
        profile: {
          first_name: 'Demo',
          last_name: 'Voyageur',
          phone: '+261 34 12 345 67',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          bio: 'Utilisateur de démonstration pour tester les fonctionnalités voyageur de GasyWay. Passionné de découvertes et d\'aventures à Madagascar.',
          role: 'voyageur'
        }
      },
      {
        id: DEMO_ADMIN_ID,
        email: 'admin@gasyway.com',
        profile: {
          first_name: 'Admin',
          last_name: 'GasyWay',
          phone: '+261 20 12 345 67',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          bio: 'Administrateur de la plateforme GasyWay. Responsable de la gestion des contenus touristiques et de l\'expérience utilisateur.',
          role: 'admin'
        }
      }
    ]

    for (const user of demoUsers) {
      try {
        // Insérer/mettre à jour dans la table users
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            status: 'active',
            gdpr_consent: true,
            locale: 'fr',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          })

        if (userError) {
          console.warn(`Erreur insertion user ${user.email}:`, userError.message)
          continue
        }

        // Insérer/mettre à jour le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            first_name: user.profile.first_name,
            last_name: user.profile.last_name,
            phone: user.profile.phone,
            avatar_url: user.profile.avatar_url,
            bio: user.profile.bio,
            role: user.profile.role,
            first_login_completed: true, // Les comptes démo ont déjà tout complété
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.warn(`Erreur insertion profil ${user.email}:`, profileError.message)
          continue
        }

        results.push(user.email)
        console.log(`✅ Données utilisateur insérées: ${user.email}`)

      } catch (error: any) {
        console.warn(`Erreur insertion ${user.email}:`, error.message)
      }
    }

    // 2. Ajouter des intérêts au voyageur démo
    try {
      // Récupérer quelques intérêts
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('id')
        .limit(4)

      if (!interestsError && interests && interests.length > 0) {
        // Supprimer les anciens intérêts du voyageur demo
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', DEMO_VOYAGEUR_ID)

        // Ajouter de nouveaux intérêts
        const userInterests = interests.map((interest, index) => ({
          user_id: DEMO_VOYAGEUR_ID,
          interest_id: interest.id,
          created_at: new Date().toISOString()
        }))

        const { error: userInterestsError } = await supabase
          .from('user_interests')
          .insert(userInterests)

        if (!userInterestsError) {
          console.log(`✅ Intérêts ajoutés au voyageur démo: ${interests.length}`)
        }
      }
    } catch (error: any) {
      console.warn('Erreur ajout intérêts voyageur demo:', error.message)
    }

    return {
      success: true,
      message: `Utilisateurs de démonstration insérés directement dans les tables SQL`,
      details: {
        inserted: results,
        note: 'Les comptes d\'authentification Supabase doivent être créés séparément',
        available: [
          'demo@voyageur.com / demo123 (ID: ' + DEMO_VOYAGEUR_ID + ')',
          'admin@gasyway.com / admin123 (ID: ' + DEMO_ADMIN_ID + ')'
        ]
      }
    }

  } catch (error: any) {
    return {
      success: false,
      message: `Erreur création utilisateurs demo: ${error.message}`
    }
  }
}