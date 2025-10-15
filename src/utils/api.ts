import { supabase, validateToken, cleanCorruptedSession } from './supabase/client'
import { withRetry, isRetryableError } from './apiRetry'
import { projectId, publicAnonKey } from './supabase/info'

/**
 * Interface pour les options des appels API
 */
interface ApiOptions {
  requireAuth?: boolean
  retryOptions?: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    timeoutMs?: number
  }
}

/**
 * Classe d'erreur spécialisée pour les erreurs d'API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public shouldRefresh?: boolean
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Obtenir le token d'accès actuel avec validation
 */
async function getValidAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      return null
    }

    // Valider le token
    if (!validateToken(session.access_token)) {
      console.warn('⚠️ Token invalide détecté, nettoyage de la session')
      await cleanCorruptedSession()
      return null
    }

    return session.access_token
  } catch (error) {
    console.error('❌ Erreur récupération token:', error)
    await cleanCorruptedSession()
    return null
  }
}

/**
 * Effectuer un appel API avec gestion robuste des erreurs
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit & ApiOptions = {}
): Promise<T> {
  const { requireAuth = false, retryOptions, ...fetchOptions } = options

  const callApi = async (): Promise<T> => {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers as Record<string, string>
    }

    // Ajouter l'authentification - toujours essayer d'utiliser le token utilisateur s'il est disponible
    const accessToken = await getValidAccessToken()
    
    if (requireAuth && !accessToken) {
      throw new ApiError('Authentification requise', 401, true)
    }
    
    if (accessToken) {
      // Utiliser le token utilisateur s'il est disponible
      headers['Authorization'] = `Bearer ${accessToken}`
    } else {
      // Fallback vers la clé anonyme seulement si pas de token utilisateur
      headers['Authorization'] = `Bearer ${publicAnonKey}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers
    })

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any

      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || `Erreur HTTP ${response.status}` }
      }

      // Gestion spéciale des erreurs d'authentification
      if (response.status === 401) {
        const shouldRefresh = errorData.shouldRefresh || 
                             errorData.error?.includes('expiré') ||
                             errorData.error?.includes('expired') ||
                             errorData.error?.includes('Token')

        if (shouldRefresh) {
          console.warn('⚠️ Token expiré, nettoyage de la session')
          await cleanCorruptedSession()
        }

        throw new ApiError(
          errorData.error || 'Erreur d\'authentification',
          response.status,
          shouldRefresh
        )
      }

      throw new ApiError(
        errorData.error || `Erreur serveur ${response.status}`,
        response.status
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }

    return await response.text() as T
  }

  // Utiliser withRetry seulement si des options de retry sont spécifiées
  if (retryOptions) {
    return withRetry(callApi, retryOptions)
  }

  return callApi()
}

/**
 * Appels API spécialisés
 */
export const api = {
  // Appels publics (sans authentification)
  get: <T = any>(endpoint: string, options?: Omit<RequestInit, 'method'>) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  // Appels authentifiés
  authGet: <T = any>(endpoint: string, options?: Omit<RequestInit, 'method'>) =>
    apiCall<T>(endpoint, { ...options, method: 'GET', requireAuth: true }),

  authPost: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth: true
    }),

  authPut: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      requireAuth: true
    }),

  authDelete: <T = any>(endpoint: string, options?: Omit<RequestInit, 'method'>) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE', requireAuth: true })
}

/**
 * Gestion globale des erreurs d'API pour les composants React
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.shouldRefresh) {
      // L'application devrait gérer le refresh de l'authentification
      return 'Session expirée, veuillez vous reconnecter'
    }
    return error.message
  }

  if (error instanceof Error) {
    if (isRetryableError(error)) {
      return 'Problème de connexion, veuillez réessayer'
    }
    return error.message
  }

  return 'Une erreur inattendue s\'est produite'
}