import { supabase } from './supabase/client'

export interface AuthAccountResult {
  success: boolean
  message: string
  details?: any
}

export async function createDemoAuthAccounts(): Promise<AuthAccountResult> {
  try {
    console.log('🔄 Création des comptes d\'authentification Supabase...')

    // IDs fixes pour correspondre aux données SQL
    const DEMO_VOYAGEUR_ID = 'a1b2c3d4-demo-user-0001-voyageur0001'
    const DEMO_ADMIN_ID = 'a1b2c3d4-demo-user-0001-admin0000001'

    const accounts = [
      {
        id: DEMO_VOYAGEUR_ID,
        email: 'demo@voyageur.com',
        password: 'demo123',
        role: 'voyageur',
        name: 'Demo Voyageur'
      },
      {
        id: DEMO_ADMIN_ID,
        email: 'admin@gasyway.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin GasyWay'
      }
    ]

    const results = []

    for (const account of accounts) {
      try {
        // Vérifier si l'utilisateur existe déjà dans Supabase Auth
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(account.id)
        
        if (existingUser && existingUser.user) {
          console.log(`✅ Compte auth déjà existant: ${account.email}`)
          results.push(`${account.email} (existant)`)
          continue
        }

        // Créer le compte avec l'ID spécifique
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          user_id: account.id, // ID fixe pour correspondre aux tables SQL
          email: account.email,
          password: account.password,
          email_confirm: true, // Confirmer automatiquement l'email
          user_metadata: {
            first_name: account.name.split(' ')[0],
            last_name: account.name.split(' ')[1] || '',
            role: account.role
          }
        })

        if (authError) {
          console.warn(`⚠️ Erreur création auth ${account.email}:`, authError.message)
          results.push(`${account.email} (erreur: ${authError.message})`)
          continue
        }

        console.log(`✅ Compte auth créé: ${account.email}`)
        results.push(`${account.email} (créé)`)

      } catch (error: any) {
        console.warn(`⚠️ Erreur pour ${account.email}:`, error.message)
        results.push(`${account.email} (erreur: ${error.message})`)
      }
    }

    return {
      success: true,
      message: 'Comptes d\'authentification traités',
      details: {
        results,
        note: 'Utilisez ces comptes pour vous connecter',
        credentials: [
          'Voyageur: demo@voyageur.com / demo123',
          'Admin: admin@gasyway.com / admin123'
        ]
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur création comptes auth:', error)
    return {
      success: false,
      message: `Erreur création comptes auth: ${error.message}`
    }
  }
}

// Fonction pour réinitialiser complètement les comptes demo
export async function resetDemoAuthAccounts(): Promise<AuthAccountResult> {
  try {
    console.log('🔄 Réinitialisation des comptes auth...')

    const accountIds = [
      'a1b2c3d4-demo-user-0001-voyageur0001',
      'a1b2c3d4-demo-user-0001-admin0000001'
    ]

    // Supprimer les comptes existants
    for (const id of accountIds) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(id)
        if (error && !error.message.includes('not found')) {
          console.warn(`Erreur suppression ${id}:`, error.message)
        }
      } catch (error: any) {
        console.warn(`Erreur suppression ${id}:`, error.message)
      }
    }

    // Recréer les comptes
    return await createDemoAuthAccounts()

  } catch (error: any) {
    return {
      success: false,
      message: `Erreur réinitialisation: ${error.message}`
    }
  }
}

// Fonction pour vérifier l'état des comptes demo
export async function checkDemoAuthAccounts(): Promise<AuthAccountResult> {
  try {
    const accountIds = [
      { id: 'a1b2c3d4-demo-user-0001-voyageur0001', email: 'demo@voyageur.com' },
      { id: 'a1b2c3d4-demo-user-0001-admin0000001', email: 'admin@gasyway.com' }
    ]

    const status = []

    for (const account of accountIds) {
      try {
        const { data: userData, error } = await supabase.auth.admin.getUserById(account.id)
        
        if (error) {
          status.push(`${account.email}: Non trouvé`)
        } else if (userData.user) {
          status.push(`${account.email}: Actif (créé ${new Date(userData.user.created_at).toLocaleDateString('fr-FR')})`)
        } else {
          status.push(`${account.email}: État inconnu`)
        }
      } catch (error: any) {
        status.push(`${account.email}: Erreur (${error.message})`)
      }
    }

    return {
      success: true,
      message: 'État des comptes de démonstration',
      details: { status }
    }

  } catch (error: any) {
    return {
      success: false,
      message: `Erreur vérification: ${error.message}`
    }
  }
}