import React from 'react'
import { Progress } from '../ui/progress'

interface OptimizedLoadingScreenProps {
  title?: string
  message?: string
  progress?: number
  showProgress?: boolean
  tips?: string[]
}

export function OptimizedLoadingScreen({ 
  title = "🇲🇬 GasyWay",
  message = "Chargement en cours...",
  progress = 0,
  showProgress = false,
  tips = []
}: OptimizedLoadingScreenProps) {
  const defaultTips = [
    "💡 Nous utilisons un cache intelligent pour accélérer le chargement",
    "🚀 Les données sont préchargées en arrière-plan",
    "⚡ Vos préférences sont sauvegardées localement",
    "🎯 L'application s'optimise automatiquement"
  ]

  const displayTips = tips.length > 0 ? tips : defaultTips
  const [currentTip, setCurrentTip] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % displayTips.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [displayTips.length])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full space-y-6 text-center p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            Plateforme de tourisme à Madagascar
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Animation de chargement optimisée */}
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <p className="text-gray-600 font-medium">
            {message}
          </p>
          
          {showProgress && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-gray-500">
                {Math.round(progress)}% complété
              </p>
            </div>
          )}

          {/* Indicateurs visuels de performance */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>

          {/* Conseils rotatifs */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-sm text-gray-700 transition-all duration-500 ease-in-out">
              {displayTips[currentTip]}
            </p>
          </div>
        </div>

        {/* Métriques de performance en temps réel (mode debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 space-y-1 bg-black/5 rounded p-2">
            <div>🔄 Cache intelligent actif</div>
            <div>⚡ Pool de requêtes optimisé</div>
            <div>📊 Monitoring temps réel</div>
          </div>
        )}
      </div>
    </div>
  )
}