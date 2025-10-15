/**
 * Utilitaires pour gérer les timeouts et retry des appels API
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  timeoutMs?: number
}

/**
 * Retry une fonction asynchrone avec backoff exponentiel
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 5000,
    timeoutMs = 15000
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrappé avec timeout
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ])
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Si c'est la dernière tentative, lance l'erreur
      if (attempt === maxRetries) {
        throw lastError
      }

      // Calcul du délai avec backoff exponentiel
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Créé une version "retry" d'une fonction Supabase
 */
export function withSupabaseRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options)
  }) as T
}

/**
 * Gestion spéciale pour les erreurs de timeout Supabase
 */
export function isTimeoutError(error: any): boolean {
  return (
    error?.message?.includes('timeout') ||
    error?.message?.includes('Timeout') ||
    error?.message?.includes('signal timed out') ||
    error?.message?.includes('AbortError') ||
    error?.name === 'AbortError' ||
    error?.code === 'ABORT_ERR'
  )
}

/**
 * Gestion spéciale pour les erreurs de connexion réseau
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('Failed to fetch') ||
    error?.code === 'NETWORK_ERROR'
  )
}

/**
 * Détermine si l'erreur est temporaire et peut être retryée
 */
export function isRetryableError(error: any): boolean {
  return isTimeoutError(error) || isNetworkError(error)
}