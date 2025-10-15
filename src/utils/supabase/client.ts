import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Export de la fonction createClient pour compatibilité
export const createClient = () => createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'gasyway-auth',
      debug: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'gasyway-web'
      },
      fetch: (url, options = {}) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
)

export const supabase = createSupabaseClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // ✅ Optimisations pour Figma Make
      storageKey: 'gasyway-auth',
      debug: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'gasyway-web'
      },
      // ✅ Timeouts optimisés pour Figma Make avec retry
      fetch: (url, options = {}) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      }
    },
    // ✅ Configuration supplémentaire pour preview
    realtime: {
      params: {
        eventsPerSecond: 2 // Limit realtime events
      }
    }
  }
)

// ✅ Fonction utilitaire pour valider les tokens
export const validateToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false
  if (token.length < 20) return false
  
  // Vérifier le format JWT basique (3 parties séparées par des points)
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  try {
    // Tenter de décoder le payload pour vérifier qu'il contient les claims requis
    const payload = JSON.parse(atob(parts[1]))
    return !!(payload.sub && payload.exp && payload.iat)
  } catch {
    return false
  }
}

// ✅ Fonction utilitaire pour nettoyer les sessions corrompues
export const cleanCorruptedSession = async () => {
  try {
    await supabase.auth.signOut()
    localStorage.removeItem('gasyway-auth')
    sessionStorage.clear()
    // ✅ Nettoyer aussi toutes les clés Supabase potentiellement corrompues
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('supabase.') || key.includes('sb-'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('🧹 Sessions corrompues nettoyées')
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage session:', error)
  }
}

// ✅ Fonction pour forcer un renouvellement de session
export const forceSessionRefresh = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('❌ Erreur renouvellement session:', error)
      await cleanCorruptedSession()
      return false
    }
    console.log('✅ Session renouvelée avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur critique renouvellement:', error)
    await cleanCorruptedSession()
    return false
  }
}

export type UserProfile = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  bio?: string
  locale: string
  role: 'traveler' | 'admin' | 'partner_stub'
  created_at: string
  updated_at: string
}

export type User = {
  id: string
  email: string
  status: 'active' | 'blocked' | 'pending'
  gdpr_consent: boolean
  locale: string
  created_at: string
  updated_at: string
  deleted_at?: string
}