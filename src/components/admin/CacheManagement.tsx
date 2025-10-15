import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  Clock, 
  TrendingUp, 
  HardDrive,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { clearAllCaches, getCacheStatus, smartCache, perfMonitor } from '../../utils/performance'
import { toast } from 'sonner'

interface CacheStats {
  smartCache: {
    size: number
    queueSize: number
    totalHits: number
    avgHits: number
  }
  requestPool: {
    active: number
    queued: number
    maxConcurrent: number
  }
  performance: any
  storage: {
    localStorage: number
    sessionStorage: number
  }
}

export function CacheManagement() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastClearTime, setLastClearTime] = useState<string | null>(null)

  const refreshStats = () => {
    const stats = getCacheStatus()
    setCacheStats(stats)
  }

  useEffect(() => {
    refreshStats()
    
    // Rafraîchir les stats toutes les 5 secondes
    const interval = setInterval(refreshStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleClearAllCaches = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setIsLoading(true)
    try {
      const result = clearAllCaches()
      setLastClearTime(new Date().toLocaleString('fr-FR'))
      
      toast.success('🧹 Caches effacés', {
        description: 'Tous les caches ont été effacés avec succès'
      })
      
      console.log('Caches cleared via interface:', result)
      
      // Rafraîchir les stats après un court délai
      setTimeout(refreshStats, 500)
    } catch (error) {
      console.error('Erreur lors de l\'effacement des caches:', error)
      toast.error('❌ Erreur', {
        description: 'Impossible d\'effacer les caches'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalidatePattern = (pattern: string) => {
    try {
      smartCache.invalidate(pattern)
      refreshStats()
      toast.success('✅ Cache invalidé', {
        description: `Toutes les entrées contenant "${pattern}" ont été supprimées`
      })
    } catch (error) {
      console.error('Erreur lors de l\'invalidation:', error)
      toast.error('❌ Erreur', {
        description: 'Impossible d\'invalider le cache'
      })
    }
  }

  const handleClearPerformanceMetrics = () => {
    try {
      perfMonitor.reset()
      refreshStats()
      toast.success('📊 Métriques effacées', {
        description: 'Les métriques de performance ont été réinitialisées'
      })
    } catch (error) {
      console.error('Erreur lors de l\'effacement des métriques:', error)
      toast.error('❌ Erreur', {
        description: 'Impossible d\'effacer les métriques'
      })
    }
  }

  if (!cacheStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Gestion des Caches</h1>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  const getTotalCacheSize = () => {
    return cacheStats.smartCache.size + 
           cacheStats.storage.localStorage + 
           cacheStats.storage.sessionStorage
  }

  const getCacheHealth = () => {
    const totalSize = getTotalCacheSize()
    const hitRate = cacheStats.smartCache.avgHits
    
    if (totalSize === 0) return { status: 'empty', color: 'gray', text: 'Vide' }
    if (totalSize > 50 || hitRate < 1) return { status: 'warning', color: 'yellow', text: 'Attention' }
    return { status: 'healthy', color: 'green', text: 'Sain' }
  }

  const health = getCacheHealth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Gestion des Caches</h1>
          <p className="text-gray-600">Surveillez et gérez les caches de l'application</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={health.status === 'healthy' ? 'default' : health.status === 'warning' ? 'secondary' : 'outline'}
            className={`${
              health.status === 'healthy' ? 'bg-green-100 text-green-800' :
              health.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {health.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
            {health.status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {health.text}
          </Badge>
          <Button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              refreshStats()
            }} 
            variant="outline" 
            size="sm"
            className="cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Actions de Nettoyage
          </CardTitle>
          <CardDescription>
            Effacez les caches pour libérer la mémoire et résoudre les problèmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClearAllCaches()
              }}
              variant="destructive"
              disabled={isLoading}
              className="flex items-center gap-2 cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Effacer Tous les Caches
            </Button>
            
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleInvalidatePattern('packs')
              }}
              variant="outline"
              className="cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              Invalider Caches Packs
            </Button>
            
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleInvalidatePattern('users')
              }}
              variant="outline"
              className="cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              Invalider Caches Users
            </Button>
            
            <Button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClearPerformanceMetrics()
              }}
              variant="outline"
              className="cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Effacer Métriques
            </Button>
          </div>
          
          {lastClearTime && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Dernière réinitialisation complète : {lastClearTime}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Smart Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Smart Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Entrées</span>
              <Badge variant="secondary">{cacheStats.smartCache.size}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">File d'attente</span>
              <Badge variant="outline">{cacheStats.smartCache.queueSize}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hits totaux</span>
              <Badge variant="default">{cacheStats.smartCache.totalHits}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hits moyens</span>
              <Badge variant="secondary">{cacheStats.smartCache.avgHits.toFixed(1)}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Request Pool */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Pool de Requêtes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Actives</span>
              <Badge 
                variant={cacheStats.requestPool.active > 0 ? "default" : "secondary"}
              >
                {cacheStats.requestPool.active}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">En attente</span>
              <Badge 
                variant={cacheStats.requestPool.queued > 0 ? "destructive" : "outline"}
              >
                {cacheStats.requestPool.queued}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Max simultanées</span>
              <Badge variant="outline">{cacheStats.requestPool.maxConcurrent}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Stockage Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">localStorage</span>
              <Badge 
                variant={cacheStats.storage.localStorage > 0 ? "default" : "outline"}
              >
                {cacheStats.storage.localStorage}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">sessionStorage</span>
              <Badge 
                variant={cacheStats.storage.sessionStorage > 0 ? "default" : "outline"}
              >
                {cacheStats.storage.sessionStorage}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span className="text-sm">Total</span>
              <Badge variant="default">
                {getTotalCacheSize()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de performance */}
      {cacheStats.performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métriques de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStats.performance.totalMetrics}</div>
                <div className="text-sm text-gray-600">Métriques</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStats.performance.totalDuration}ms</div>
                <div className="text-sm text-gray-600">Durée totale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStats.performance.avgDuration}ms</div>
                <div className="text-sm text-gray-600">Moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cacheStats.performance.slowest.duration}ms</div>
                <div className="text-sm text-gray-600">Plus lent</div>
              </div>
            </div>
            
            {cacheStats.performance.slowest && (
              <Alert className="mt-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Opération la plus lente : <strong>{cacheStats.performance.slowest.name}</strong> ({cacheStats.performance.slowest.duration}ms)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section d'aide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Guide d'utilisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Raccourci clavier :</strong> <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+Shift+C</kbd> pour effacer tous les caches</p>
            <p><strong>Console navigateur :</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">window.GasyWay.clearAllCaches()</code></p>
            <p><strong>Interface admin :</strong> Utilisez les boutons ci-dessus pour des actions spécifiques</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}