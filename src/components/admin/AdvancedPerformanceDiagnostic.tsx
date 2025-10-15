import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { clearAllCaches } from '../../utils/performance'
import { toast } from 'sonner'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Database, 
  Users, 
  Shield,
  Activity,
  Gauge,
  HardDrive,
  Wifi,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { perfMonitor, smartCache, requestPool } from '../../utils/performance'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'excellent' | 'good' | 'poor' | 'critical'
  description: string
}

interface SystemHealth {
  overall: number
  categories: {
    network: number
    cache: number
    memory: number
    api: number
  }
}

export function AdvancedPerformanceDiagnostic() {
  const [isRunning, setIsRunning] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [memoryUsage, setMemoryUsage] = useState<any>(null)

  useEffect(() => {
    // Surveillance continue des métriques de base
    const interval = setInterval(() => {
      updateBasicMetrics()
    }, 5000) // Mise à jour toutes les 5 secondes

    updateBasicMetrics()
    return () => clearInterval(interval)
  }, [])

  async function updateBasicMetrics() {
    // Métriques de cache
    const cacheData = smartCache.getStats()
    setCacheStats(cacheData)

    // Métriques de pool de requêtes
    const poolStats = requestPool.getStats()

    // Métriques de mémoire (si disponible)
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      const memoryData = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      }
      setMemoryUsage(memoryData)
    }
  }

  async function runComprehensiveDiagnostic() {
    setIsRunning(true)
    const diagnosticMetrics: PerformanceMetric[] = []

    try {
      console.log('🔍 Démarrage du diagnostic avancé...')

      // 1. Test de latence réseau
      const networkStart = performance.now()
      try {
        const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
        const latency = performance.now() - networkStart
        setNetworkLatency(latency)

        diagnosticMetrics.push({
          name: 'Latence réseau',
          value: Math.round(latency),
          unit: 'ms',
          status: latency < 100 ? 'excellent' : latency < 300 ? 'good' : latency < 1000 ? 'poor' : 'critical',
          description: 'Temps de réponse du serveur Supabase'
        })
      } catch (error) {
        diagnosticMetrics.push({
          name: 'Latence réseau',
          value: -1,
          unit: 'ms',
          status: 'critical',
          description: 'Connexion au serveur échouée'
        })
      }

      // 2. Performance du cache
      const cacheData = smartCache.getStats()
      const cacheHitRate = cacheData.totalHits > 0 ? (cacheData.totalHits / (cacheData.totalHits + cacheData.size)) * 100 : 0

      diagnosticMetrics.push({
        name: 'Taux de cache hit',
        value: Math.round(cacheHitRate),
        unit: '%',
        status: cacheHitRate > 80 ? 'excellent' : cacheHitRate > 60 ? 'good' : cacheHitRate > 30 ? 'poor' : 'critical',
        description: 'Efficacité du cache intelligent'
      })

      // 3. Pool de requêtes
      const poolStats = requestPool.getStats()
      const poolEfficiency = poolStats.active / poolStats.maxConcurrent * 100

      diagnosticMetrics.push({
        name: 'Utilisation pool',
        value: Math.round(poolEfficiency),
        unit: '%',
        status: poolEfficiency < 60 ? 'excellent' : poolEfficiency < 80 ? 'good' : poolEfficiency < 95 ? 'poor' : 'critical',
        description: 'Utilisation du pool de requêtes'
      })

      // 4. Métriques de performance globales
      const perfStats = perfMonitor.getSummary()
      if (perfStats) {
        diagnosticMetrics.push({
          name: 'Temps moyen API',
          value: perfStats.avgDuration,
          unit: 'ms',
          status: perfStats.avgDuration < 500 ? 'excellent' : perfStats.avgDuration < 1000 ? 'good' : perfStats.avgDuration < 2000 ? 'poor' : 'critical',
          description: 'Temps de réponse moyen des APIs'
        })
      }

      // 5. Mémoire utilisée
      if (memoryUsage) {
        const memoryPercentage = (memoryUsage.used / memoryUsage.limit) * 100

        diagnosticMetrics.push({
          name: 'Utilisation mémoire',
          value: Math.round(memoryPercentage),
          unit: '%',
          status: memoryPercentage < 50 ? 'excellent' : memoryPercentage < 70 ? 'good' : memoryPercentage < 85 ? 'poor' : 'critical',
          description: `${memoryUsage.used}MB/${memoryUsage.limit}MB utilisés`
        })
      }

      // 6. Test de localStorage
      const localStorageStart = performance.now()
      try {
        const testData = { test: Date.now() }
        localStorage.setItem('perf_test', JSON.stringify(testData))
        const retrieved = JSON.parse(localStorage.getItem('perf_test') || '{}')
        localStorage.removeItem('perf_test')
        const localStorageTime = performance.now() - localStorageStart

        diagnosticMetrics.push({
          name: 'Performance localStorage',
          value: Math.round(localStorageTime),
          unit: 'ms',
          status: localStorageTime < 5 ? 'excellent' : localStorageTime < 15 ? 'good' : localStorageTime < 50 ? 'poor' : 'critical',
          description: 'Vitesse lecture/écriture cache local'
        })
      } catch (error) {
        diagnosticMetrics.push({
          name: 'Performance localStorage',
          value: -1,
          unit: 'ms',
          status: 'critical',
          description: 'LocalStorage non disponible'
        })
      }

      setMetrics(diagnosticMetrics)

      // Calculer la santé globale du système
      const healthScores = {
        network: getHealthScore(diagnosticMetrics.find(m => m.name === 'Latence réseau')),
        cache: getHealthScore(diagnosticMetrics.find(m => m.name === 'Taux de cache hit')),
        memory: getHealthScore(diagnosticMetrics.find(m => m.name === 'Utilisation mémoire')),
        api: getHealthScore(diagnosticMetrics.find(m => m.name === 'Temps moyen API')) || 85
      }

      const overallHealth = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / Object.keys(healthScores).length

      setSystemHealth({
        overall: Math.round(overallHealth),
        categories: {
          network: Math.round(healthScores.network),
          cache: Math.round(healthScores.cache),
          memory: Math.round(healthScores.memory),
          api: Math.round(healthScores.api)
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error)
    } finally {
      setIsRunning(false)
    }
  }

  function getHealthScore(metric?: PerformanceMetric): number {
    if (!metric) return 50

    switch (metric.status) {
      case 'excellent': return 95
      case 'good': return 80
      case 'poor': return 60
      case 'critical': return 30
      default: return 50
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'poor': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'poor': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const handleClearCaches = () => {
    try {
      const result = clearAllCaches()
      toast.success('🧹 Caches effacés', {
        description: 'Tous les caches ont été nettoyés avec succès'
      })
      console.log('Caches cleared:', result)
    } catch (error) {
      console.error('Error clearing caches:', error)
      toast.error('Erreur', {
        description: 'Impossible d\'effacer les caches'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl">Diagnostic avancé des performances</h1>
          <p className="text-gray-600">Analyse complète des performances système en temps réel</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleClearCaches}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Effacer Caches
          </Button>
          
          <Button 
            onClick={runComprehensiveDiagnostic}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Lancer le diagnostic
              </>
            )}
          </Button>
        </div>
      </div>

      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="h-5 w-5" />
              <span>État de santé général</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: systemHealth.overall > 80 ? '#22c55e' : systemHealth.overall > 60 ? '#3b82f6' : systemHealth.overall > 40 ? '#f59e0b' : '#ef4444' }}>
                  {systemHealth.overall}%
                </div>
                <div className="text-sm text-gray-600">Score global</div>
                <Progress value={systemHealth.overall} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{systemHealth.categories.network}%</div>
                <div className="text-sm text-gray-600 mb-2">Réseau</div>
                <Progress value={systemHealth.categories.network} className="h-2" />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{systemHealth.categories.cache}%</div>
                <div className="text-sm text-gray-600 mb-2">Cache</div>
                <Progress value={systemHealth.categories.cache} className="h-2" />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{systemHealth.categories.memory}%</div>
                <div className="text-sm text-gray-600 mb-2">Mémoire</div>
                <Progress value={systemHealth.categories.memory} className="h-2" />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{systemHealth.categories.api}%</div>
                <div className="text-sm text-gray-600 mb-2">APIs</div>
                <Progress value={systemHealth.categories.api} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métriques de performance</TabsTrigger>
          <TabsTrigger value="cache">Cache intelligent</TabsTrigger>
          <TabsTrigger value="realtime">Temps réel</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(metric.status)}
                      <div>
                        <h3 className="font-medium flex items-center space-x-2">
                          <span>{metric.name}</span>
                        </h3>
                        <p className="text-sm text-gray-600">{metric.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <div className="text-lg font-semibold">
                          {metric.value === -1 ? 'N/A' : `${metric.value}${metric.unit}`}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${getStatusColor(metric.status)} text-white`}>
                          {metric.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Cache intelligent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cacheStats && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Entrées en cache:</span>
                      <Badge variant="outline">{cacheStats.size}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits totaux:</span>
                      <Badge variant="outline">{cacheStats.totalHits || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits moyens:</span>
                      <Badge variant="outline">{Math.round(cacheStats.avgHits || 0)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Requêtes en attente:</span>
                      <Badge variant="outline">{cacheStats.queueSize || 0}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Pool de requêtes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requestPool && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Actives:</span>
                      <Badge variant="outline">{requestPool.getStats().active}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>En attente:</span>
                      <Badge variant="outline">{requestPool.getStats().queued}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite:</span>
                      <Badge variant="outline">{requestPool.getStats().maxConcurrent}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Mémoire</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memoryUsage ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Utilisée:</span>
                      <Badge variant="outline">{memoryUsage.used} MB</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Totale:</span>
                      <Badge variant="outline">{memoryUsage.total} MB</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Limite:</span>
                      <Badge variant="outline">{memoryUsage.limit} MB</Badge>
                    </div>
                    <Progress value={(memoryUsage.used / memoryUsage.limit) * 100} className="mt-2" />
                  </div>
                ) : (
                  <p className="text-gray-500">Métriques non disponibles</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4" />
                  <span>Latence réseau</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    {networkLatency ? `${Math.round(networkLatency)}ms` : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600">Temps de réponse Supabase</p>
                  {networkLatency && (
                    <Progress 
                      value={Math.min((networkLatency / 1000) * 100, 100)} 
                      className="mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Performance historique</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {perfMonitor.getSummary() ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Mesures totales:</span>
                      <Badge variant="outline">{perfMonitor.getSummary()?.totalMetrics}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Temps moyen:</span>
                      <Badge variant="outline">{perfMonitor.getSummary()?.avgDuration}ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Plus lent:</span>
                      <Badge variant="destructive">{perfMonitor.getSummary()?.slowest.duration}ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Plus rapide:</span>
                      <Badge variant="default">{perfMonitor.getSummary()?.fastest.duration}ms</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aucune donnée historique</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h3 className="font-medium text-green-900">🧹 Actions Rapides</h3>
          <Button 
            onClick={handleClearCaches}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white w-fit"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Effacer Tout
          </Button>
        </div>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Raccourci clavier : <kbd className="bg-white px-2 py-1 rounded border text-xs">Ctrl+Shift+C</kbd></li>
          <li>• Console navigateur : <code className="bg-white px-2 py-1 rounded text-xs">window.GasyWay.clearAllCaches()</code></li>
          <li>• Interface admin : Section "Gestion Caches" dans le menu Système</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🚀 Optimisations activées</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cache intelligent avec déduplication des requêtes</li>
          <li>• Pool de connexions pour limiter les requêtes simultanées</li>
          <li>• Retry automatique avec backoff exponentiel</li>
          <li>• Préchargement intelligent des données</li>
          <li>• Nettoyage automatique de la mémoire</li>
          <li>• Monitoring en temps réel des performances</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">💡 Recommandations</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Excellent (plus de 95%): Performance optimale</li>
          <li>• Bon (plus de 80%): Performance satisfaisante</li>
          <li>• Moyen (plus de 60%): Optimisations recommandées</li>
          <li>• Critique (moins de 60%): Action immédiate requise</li>
        </ul>
      </div>
    </div>
  )
}