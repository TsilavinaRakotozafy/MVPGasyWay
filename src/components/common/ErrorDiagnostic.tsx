import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw, Bug, X } from 'lucide-react'

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
}

export function ErrorDiagnostic() {
  const [errors, setErrors] = useState<ErrorInfo[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Intercepter les erreurs globales
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erreur capturée:', event.error)
      
      if (event.error?.message?.includes('toLowerCase') || 
          event.error?.message?.includes('Cannot coerce the result to a single JSON object')) {
        setErrors(prev => [...prev, {
          message: event.error.message,
          stack: event.error.stack,
          timestamp: Date.now()
        }])
        setIsVisible(true)
      }
    }

    // Intercepter les erreurs de promesse
    const handlePromiseError = (event: PromiseRejectionEvent) => {
      console.error('🚨 Erreur promise capturée:', event.reason)
      
      if (event.reason?.message?.includes('toLowerCase') ||
          event.reason?.message?.includes('Cannot coerce the result to a single JSON object')) {
        setErrors(prev => [...prev, {
          message: event.reason.message,
          stack: event.reason.stack,
          timestamp: Date.now()
        }])
        setIsVisible(true)
      }
    }

    // Intercepter les erreurs React
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('toLowerCase') || 
          message.includes('Cannot coerce the result to a single JSON object')) {
        setErrors(prev => [...prev, {
          message: message,
          timestamp: Date.now()
        }])
        setIsVisible(true)
      }
      originalConsoleError(...args)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handlePromiseError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handlePromiseError)
      console.error = originalConsoleError
    }
  }, [])

  const clearErrors = () => {
    setErrors([])
    setIsVisible(false)
  }

  const reload = () => {
    window.location.reload()
  }

  if (!isVisible || errors.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Erreur toLowerCase détectée
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
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {errors.slice(-3).map((error, index) => (
              <div key={index} className="p-2 bg-background rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Bug className="h-3 w-3 text-destructive" />
                  <Badge variant="destructive" className="text-xs">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
                <p className="text-xs text-destructive font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                      {error.stack.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearErrors}>
              Effacer
            </Button>
            <Button size="sm" onClick={reload}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Recharger
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <strong>Solutions probables :</strong>
            <br />
            • <strong>toLowerCase undefined:</strong> Variable undefined quand .toLowerCase() est appelé
            <br />
            • <strong>Cannot coerce JSON object:</strong> Doublons dans la table users
            <br />
            • Vérifiez PhoneInput ou utilisez le "Correcteur Doublons" en mode admin
            <br />
            • Ajoutez des vérifications : variable?.toLowerCase?.() || ''
          </div>
        </CardContent>
      </Card>
    </div>
  )
}