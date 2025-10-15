import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner@2.0.3'
import { isTimeoutError, isNetworkError } from '../utils/apiRetry'

interface ConnectionMonitorState {
  isOnline: boolean
  isSlowConnection: boolean
  connectionQuality: 'good' | 'slow' | 'poor' | 'offline'
  lastError: Error | null
}

export const useConnectionMonitor = () => {
  const [state, setState] = useState<ConnectionMonitorState>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionQuality: 'good',
    lastError: null
  })

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        connectionQuality: 'good',
        lastError: null
      }))
      toast.success('Connexion rétablie')
    }

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        connectionQuality: 'offline'
      }))
      toast.error('Connexion perdue')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Test connection quality periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const testConnection = async () => {
      if (!navigator.onLine) return

      try {
        const startTime = performance.now()
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        })
        const endTime = performance.now()
        const duration = endTime - startTime

        if (response.ok) {
          let quality: ConnectionMonitorState['connectionQuality']
          if (duration < 1000) {
            quality = 'good'
          } else if (duration < 3000) {
            quality = 'slow'
          } else {
            quality = 'poor'
          }

          setState(prev => ({
            ...prev,
            isOnline: true,
            isSlowConnection: duration > 2000,
            connectionQuality: quality,
            lastError: null
          }))
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          connectionQuality: 'poor',
          lastError: error instanceof Error ? error : new Error('Connection test failed')
        }))
      }
    }

    // Test immediately
    testConnection()

    // Then test every 30 seconds
    intervalId = setInterval(testConnection, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const handleApiError = useCallback((error: any, context: string = '') => {
    const errorToAnalyze = error?.error || error

    setState(prev => ({ ...prev, lastError: errorToAnalyze }))

    if (isTimeoutError(errorToAnalyze)) {
      setState(prev => ({ ...prev, connectionQuality: 'poor', isSlowConnection: true }))
      toast.error(`Connexion trop lente${context ? ` (${context})` : ''}`, {
        description: 'Veuillez réessayer dans quelques instants'
      })
    } else if (isNetworkError(errorToAnalyze)) {
      setState(prev => ({ ...prev, connectionQuality: 'poor' }))
      toast.error(`Problème de réseau${context ? ` (${context})` : ''}`, {
        description: 'Vérifiez votre connexion internet'
      })
    } else {
      // Autres erreurs
      console.error(`Erreur API${context ? ` (${context})` : ''}:`, errorToAnalyze)
    }
  }, [])

  const retry = useCallback(async (fn: () => Promise<any>, context: string = '') => {
    try {
      setState(prev => ({ ...prev, lastError: null }))
      return await fn()
    } catch (error) {
      handleApiError(error, context)
      throw error
    }
  }, [handleApiError])

  return {
    ...state,
    handleApiError,
    retry
  }
}

export default useConnectionMonitor