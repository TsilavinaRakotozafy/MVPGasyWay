import { projectId, publicAnonKey } from './supabase/info'

export async function ensureDemoUsersExist() {
  try {
    console.log('Vérification/création des utilisateurs de démo...')
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('Utilisateurs de démo créés/vérifiés:', result)
      return { success: true, ...result }
    } else {
      console.error('Erreur création utilisateurs démo:', result)
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Erreur réseau lors de la création des utilisateurs démo:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur réseau' 
    }
  }
}

export async function testDemoUserLogin(email: string, password: string) {
  try {
    const { supabase } = await import('./supabase/client')
    
    console.log(`Test de connexion pour ${email}...`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Erreur connexion démo:', error.message)
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log('Connexion démo réussie:', data.user.email)
      await supabase.auth.signOut() // Déconnexion immédiate pour le test
      return { success: true, user: data.user }
    }

    return { success: false, error: 'Aucun utilisateur retourné' }
  } catch (error) {
    console.error('Erreur test connexion démo:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}