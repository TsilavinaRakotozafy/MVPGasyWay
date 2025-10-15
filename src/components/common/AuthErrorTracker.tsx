import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw, Info, CheckCircle, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'

interface AuthError {
  type: 'null_access' | 'loading_error' | 'property_access' | 'other'
  message: string
  stack?: string
  timestamp: number
  context?: string
}

export function AuthErrorTracker() {
  const { user, loading, refreshUser } = useAuth()
  const [errors, setErrors] = useState<AuthError[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Intercepter les erreurs spécifiques à l'auth
    const originalConsoleError = console.error

    console.error = (...args) => {
      const message = args.join(' ')
      
      if (message.includes('Cannot read properties of null') && 
          (message.includes('status') || message.includes('first_login_completed') || 
           message.includes('role') || message.includes('loadUserData'))) {
        
        const errorType: AuthError['type'] = message.includes('loadUserData') ? 'loading_error' : 'null_access'
        
        setErrors(prev => [...prev, {
          type: errorType,
          message: message,
          timestamp: Date.now(),
          context: `User: ${user ? 'present' : 'null'}, Loading: ${loading}`
        }])
        setIsVisible(true)
      }
      
      originalConsoleError(...args)
    }

    // Surveillance proactive
    const checkAuthState = () => {
      try {
        if (!loading && user === null) {
          // État potentiellement problématique
          const authState = {
            userNull: user === null,
            loading: loading,
            timestamp: Date.now()
          }
          
          console.log('🔍 [AuthTracker] État auth surveillé:', authState)
        }
      } catch (error: any) {
        setErrors(prev => [...prev, {
          type: 'other',
          message: error.message || 'Erreur inconnue',
          timestamp: Date.now(),
          context: 'Surveillance auth'
        }])
        setIsVisible(true)
      }
    }

    const interval = setInterval(checkAuthState, 5000) // Check toutes les 5 secondes

    return () => {
      console.error = originalConsoleError
      clearInterval(interval)
    }
  }, [user, loading])

  const getErrorTypeInfo = (type: AuthError['type']) => {
    switch (type) {
      case 'null_access':
        return {
          color: 'destructive',
          label: 'Accès NULL',
          description: 'Tentative d\'accès à une propriété sur null'
        }
      case 'loading_error':
        return {
          color: 'secondary',
          label: 'Erreur Chargement',
          description: 'Erreur lors du chargement des données utilisateur'
        }
      case 'property_access':
        return {
          color: 'secondary',
          label: 'Accès Propriété',
          description: 'Erreur d\'accès à une propriété utilisateur'
        }
      default:
        return {
          color: 'secondary',
          label: 'Autre',
          description: 'Autre erreur d\'authentification'
        }
    }
  }

  const clearErrors = () => {
    setErrors([])
    setIsVisible(false)
  }

  const handleRefresh = async () => {
    try {
      await refreshUser()
      console.log('✅ [AuthTracker] Rafraîchissement utilisateur effectué')
    } catch (error) {
      console.error('❌ [AuthTracker] Erreur rafraîchissement:', error)
    }
  }

  const getCurrentAuthState = () => {
    return {
      userExists: !!user,
      userProperties: user ? {
        hasId: !!user.id,
        hasEmail: !!user.email,
        hasStatus: !!user.status,
        hasRole: !!user.role,
        hasFirstLogin: typeof user.first_login_completed !== 'undefined'
      } : null,
      loading,
      errorCount: errors.length
    }
  }

  const authState = getCurrentAuthState()

  if (!isVisible && errors.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-[9999] max-w-lg space-y-2">
      {/* Indicateur d'état rapide */}
      <Card className={`border ${authState.errorCount > 0 ? 'border-destructive bg-destructive/5' : 'border-green-500 bg-green-50'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {authState.errorCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Auth Tracker
            </CardTitle>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Utilisateur:</span>
              <Badge variant={authState.userExists ? 'default' : 'destructive'}>
                {authState.userExists ? 'Présent' : 'NULL'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Chargement:</span>
              <Badge variant={authState.loading ? 'secondary' : 'default'}>
                {authState.loading ? 'En cours' : 'Terminé'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Erreurs:</span>
              <Badge variant={authState.errorCount > 0 ? 'destructive' : 'default'}>
                {authState.errorCount}
              </Badge>
            </div>
          </div>

          {authState.userExists && authState.userProperties && (
            <div className="text-xs space-y-1 mt-2 p-2 bg-background rounded border">
              <p className="font-medium">Propriétés Utilisateur:</p>
              {Object.entries(authState.userProperties).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <Badge variant={value ? 'default' : 'destructive'} className="text-xs">
                    {value ? '✓' : '✗'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <p className="text-xs font-medium">Erreurs Récentes:</p>
              {errors.slice(-3).map((error, index) => {
                const info = getErrorTypeInfo(error.type)
                return (
                  <div key={index} className="p-2 bg-background rounded border text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={info.color as any} className="text-xs">
                        {info.label}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-destructive font-mono text-xs break-all">
                      {error.message.slice(0, 100)}...
                    </p>
                    {error.context && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {error.context}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearErrors}>
              Effacer
            </Button>
            <Button size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}