import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '../ui/alert'
import { WifiOff, Wifi, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'

interface ConnectionStatusProps {
  className?: string
}

type ConnectionState = 'online' | 'offline' | 'slow' | 'error'

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = "" 
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('online')
  const [showAlert, setShowAlert] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkConnection = async () => {
      try {
        const startTime = Date.now()
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const endTime = Date.now()
        const duration = endTime - startTime

        if (response.ok) {
          if (duration > 3000) {
            setConnectionState('slow')
            setShowAlert(true)
          } else {
            setConnectionState('online')
            setShowAlert(false)
            setRetryCount(0)
          }
        } else {
          setConnectionState('error')
          setShowAlert(true)
        }
      } catch (error) {
        setConnectionState('offline')
        setShowAlert(true)
      }
    }

    const handleOnline = () => {
      setConnectionState('online')
      setShowAlert(false)
      setRetryCount(0)
    }

    const handleOffline = () => {
      setConnectionState('offline')
      setShowAlert(true)
    }

    // Check initial connection
    checkConnection()

    // Listen to browser events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic check when connection seems problematic
    if (connectionState !== 'online') {
      timeoutId = setTimeout(checkConnection, 10000) // Check every 10s when having issues
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectionState, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setShowAlert(false)
    
    // Force a connection check
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const getAlertConfig = () => {
    switch (connectionState) {
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: <WifiOff className="h-4 w-4" />,
          title: 'Connexion perdue',
          description: 'Vérifiez votre connexion internet et réessayez.',
          showRetry: true
        }
      case 'slow':
        return {
          variant: 'default' as const,
          icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
          title: 'Connexion lente',
          description: 'La connexion semble ralentie. Certaines fonctionnalités peuvent être affectées.',
          showRetry: false
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Problème de connexion',
          description: 'Une erreur de connexion s\'est produite.',
          showRetry: true
        }
      default:
        return null
    }
  }

  if (!showAlert || connectionState === 'online') {
    return null
  }

  const alertConfig = getAlertConfig()
  if (!alertConfig) return null

  return (
    <Alert variant={alertConfig.variant} className={`${className} mb-4`}>
      {alertConfig.icon}
      <AlertDescription className="flex items-center justify-between w-full">
        <div>
          <strong>{alertConfig.title}</strong>
          <div className="text-sm mt-1">{alertConfig.description}</div>
        </div>
        {alertConfig.showRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            className="ml-4 flex-shrink-0"
          >
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default ConnectionStatus