/**
 * Utilitaires de performance pour GasyWay
 * Permet de mesurer et optimiser les temps de chargement
 */

interface PerformanceMetric {
  name: string
  start: number
  end?: number
  duration?: number
  metadata?: any
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private enabled: boolean = true

  constructor() {
    // Désactiver en production si nécessaire
    this.enabled = true // process.env.NODE_ENV !== 'production'
  }

  /**
   * Démarre la mesure d'une métrique
   */
  start(name: string, metadata?: any) {
    if (!this.enabled) return

    this.metrics.set(name, {
      name,
      start: performance.now(),
      metadata
    })

    console.log(`🔄 [PERF] Début: ${name}`)
  }

  /**
   * Termine la mesure d'une métrique
   */
  end(name: string, metadata?: any) {
    if (!this.enabled) return

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`⚠️ [PERF] Métrique non trouvée: ${name}`)
      return
    }

    const end = performance.now()
    const duration = end - metric.start

    metric.end = end
    metric.duration = duration
    metric.metadata = { ...metric.metadata, ...metadata }

    const status = duration > 2000 ? '🐌' : duration > 1000 ? '⚡' : '✅'
    console.log(`${status} [PERF] ${name}: ${Math.round(duration)}ms`, metric.metadata)

    return {
      name,
      duration,
      metadata: metric.metadata
    }
  }

  /**
   * Démarre un timer et retourne une fonction pour l'arrêter
   */
  startTimer(name: string, metadata?: any): () => void {
    this.start(name, metadata)
    return () => this.end(name)
  }

  /**
   * Mesure automatiquement une fonction async
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await fn()
      this.end(name, { success: true })
      return result
    } catch (error) {
      this.end(name, { success: false, error: error.message })
      throw error
    }
  }

  /**
   * Obtient toutes les métriques collectées
   */
  getAllMetrics() {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  /**
   * Obtient un résumé des performances
   */
  getSummary() {
    const metrics = this.getAllMetrics()
    if (metrics.length === 0) return null

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    const avgDuration = totalDuration / metrics.length
    const slowest = metrics.reduce((max, m) => 
      (m.duration || 0) > (max.duration || 0) ? m : max
    )
    const fastest = metrics.reduce((min, m) => 
      (m.duration || 0) < (min.duration || 0) ? m : min
    )

    return {
      totalMetrics: metrics.length,
      totalDuration: Math.round(totalDuration),
      avgDuration: Math.round(avgDuration),
      slowest: {
        name: slowest.name,
        duration: Math.round(slowest.duration || 0)
      },
      fastest: {
        name: fastest.name,
        duration: Math.round(fastest.duration || 0)
      }
    }
  }

  /**
   * Nettoie les métriques
   */
  reset() {
    this.metrics.clear()
    console.log('🧹 [PERF] Métriques réinitialisées')
  }

  /**
   * Active/désactive le monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    console.log(`${enabled ? '✅' : '❌'} [PERF] Monitoring ${enabled ? 'activé' : 'désactivé'}`)
  }
}

// Instance globale du moniteur de performances
export const perfMonitor = new PerformanceMonitor()

/**
 * Décorateur pour mesurer automatiquement les méthodes
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      return await perfMonitor.measure(metricName, () => originalMethod.apply(this, args))
    }
  }
}

/**
 * Mesure les temps de chargement des ressources
 */
export function measureResourceLoading() {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    console.log('📊 [PERF] Navigation Timing:')
    console.log(`  • DNS Lookup: ${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`)
    console.log(`  • TCP Connection: ${Math.round(navigation.connectEnd - navigation.connectStart)}ms`)
    console.log(`  • Request/Response: ${Math.round(navigation.responseEnd - navigation.requestStart)}ms`)
    console.log(`  • DOM Content Loaded: ${Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart)}ms`)
    console.log(`  • Page Load Complete: ${Math.round(navigation.loadEventEnd - navigation.navigationStart)}ms`)

    // Identifier les ressources lentes
    const slowResources = resources.filter(r => r.duration > 1000)
    if (slowResources.length > 0) {
      console.warn('🐌 [PERF] Ressources lentes détectées:')
      slowResources.forEach(r => {
        console.warn(`  • ${r.name}: ${Math.round(r.duration)}ms`)
      })
    }
  })
}

/**
 * Surveille la mémoire utilisée
 */
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return

  const checkMemory = () => {
    const memory = (performance as any).memory
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

    console.log(`🧠 [PERF] Mémoire: ${used}MB/${total}MB (limite: ${limit}MB)`)
    if (used / limit > 0.9) {
      console.warn('⚠️ [PERF] Utilisation mémoire élevée!')
    }
  }

  // Vérifier toutes les 30 secondes
  setInterval(checkMemory, 30000)
  checkMemory() // Vérification initiale
}

/**
 * Cache intelligent avec optimisations avancées
 */
export class SmartCache {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number, hits: number }>()
  private requestQueue = new Map<string, Promise<any>>() // Pour éviter les requêtes duplicatas
  private readonly MAX_CACHE_SIZE = 100

  set(key: string, data: any, ttlMs: number = 240000) { // ✅ 4 minutes par défaut optimisé
    // Si le cache est plein, supprimer les entrées les moins utilisées
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Incrémenter le compteur d'utilisation
    entry.hits++
    return entry.data
  }

  // Mise en cache intelligente avec déduplication des requêtes
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 180000): Promise<T> {
    // Vérifier le cache d'abord
    const cached = this.get(key)
    if (cached !== null) {
      console.log(`🎯 Cache hit: ${key}`)
      return cached
    }

    // Si une requête similaire est en cours, l'attendre
    if (this.requestQueue.has(key)) {
      console.log(`⏳ Attente requête en cours: ${key}`)
      return this.requestQueue.get(key)!
    }

    // Démarrer une nouvelle requête
    console.log(`🔄 Cache miss, fetching: ${key}`)
    const requestPromise = fetcher().then(data => {
      this.set(key, data, ttlMs)
      this.requestQueue.delete(key)
      return data
    }).catch(error => {
      this.requestQueue.delete(key)
      throw error
    })

    this.requestQueue.set(key, requestPromise)
    return requestPromise
  }

  invalidate(pattern: string) {
    let removed = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        removed++
      }
    }
    console.log(`🧹 Cache invalidated: ${pattern} (${removed} entrées supprimées)`)
  }

  clear() {
    this.cache.clear()
    this.requestQueue.clear()
    console.log('🧹 Smart cache cleared')
  }

  private evictLeastUsed() {
    let leastUsed = { key: '', hits: Infinity }
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastUsed.hits) {
        leastUsed = { key, hits: entry.hits }
      }
    }
    
    if (leastUsed.key) {
      this.cache.delete(leastUsed.key)
      console.log(`🗑️ Cache eviction: ${leastUsed.key} (${leastUsed.hits} hits)`)
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      queueSize: this.requestQueue.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      avgHits: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length : 0
    }
  }

  // Nettoyage périodique
  cleanup() {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cache cleanup: ${removed} entrées expirées supprimées`)
    }
  }
}

/**
 * Pool de connexions pour limiter les requêtes simultanées
 */
export class RequestPool {
  private activeRequests = 0
  private queue: Array<() => void> = []
  private readonly maxConcurrent: number

  constructor(maxConcurrent = 6) { // Optimisé pour les navigateurs modernes
    this.maxConcurrent = maxConcurrent
  }

  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        this.activeRequests++
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
          this.processQueue()
        }
      }

      if (this.activeRequests < this.maxConcurrent) {
        executeRequest()
      } else {
        this.queue.push(executeRequest)
      }
    })
  }

  private processQueue() {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const next = this.queue.shift()
      if (next) next()
    }
  }

  getStats() {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    }
  }
}

// Instances globales optimisées
export const smartCache = new SmartCache()
export const requestPool = new RequestPool(4) // 4 requêtes simultanées max

/**
 * Wrapper optimisé pour les appels API
 */
export async function optimizedApiCall<T>(
  key: string, 
  apiCall: () => Promise<T>, 
  options: {
    ttl?: number
    usePool?: boolean
    retries?: number
  } = {}
): Promise<T> {
  const { ttl = 180000, usePool = true, retries = 2 } = options

  const executeRequest = async (): Promise<T> => {
    return smartCache.getOrFetch(key, async () => {
      let attempt = 0
      let lastError: Error | null = null

      while (attempt <= retries) {
        try {
          const result = await perfMonitor.measure(`API: ${key}`, apiCall)
          return result
        } catch (error) {
          lastError = error as Error
          attempt++
          
          if (attempt <= retries) {
            // Backoff exponentiel rapide
            const delay = Math.min(200 * Math.pow(1.5, attempt - 1), 1500)
            await new Promise(resolve => setTimeout(resolve, delay))
            console.warn(`🔄 Retry ${attempt}/${retries} for ${key}`)
          }
        }
      }
      
      throw lastError || new Error(`Failed after ${retries} retries: ${key}`)
    }, ttl)
  }

  if (usePool) {
    return requestPool.execute(executeRequest)
  } else {
    return executeRequest()
  }
}

/**
 * Debouncer pour optimiser les appels répétitifs
 */
export function createDebouncer<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: number | undefined

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

/**
 * Throttler pour limiter la fréquence d'exécution
 */
export function createThrottler<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastExecution = 0
  let timeoutId: number | undefined

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecution

    if (timeSinceLastExecution >= delay) {
      lastExecution = now
      fn(...args)
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        lastExecution = Date.now()
        fn(...args)
      }, delay - timeSinceLastExecution)
    }
  }) as T
}

/**
 * Préchargement intelligent des données
 */
export class DataPreloader {
  private preloadQueue: Array<{ key: string, fetcher: () => Promise<any>, priority: number }> = []
  private isPreloading = false

  schedule(key: string, fetcher: () => Promise<any>, priority = 1) {
    // Éviter les doublons
    if (this.preloadQueue.some(item => item.key === key)) {
      return
    }

    if (smartCache.get(key)) {
      return // Déjà en cache
    }

    this.preloadQueue.push({ key, fetcher, priority })
    this.preloadQueue.sort((a, b) => b.priority - a.priority) // Trier par priorité

    this.processQueue()
  }

  private async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    while (this.preloadQueue.length > 0 && requestPool.getStats().active < 2) {
      const item = this.preloadQueue.shift()
      if (!item) break

      try {
        await optimizedApiCall(item.key, item.fetcher, { usePool: false })
        console.log(`🚀 Preloaded: ${item.key}`)
      } catch (error) {
        console.warn(`❌ Preload failed: ${item.key}`, error)
      }
    }

    this.isPreloading = false
  }

  clear() {
    this.preloadQueue = []
  }
}

export const dataPreloader = new DataPreloader()

// Nettoyage automatique du cache
if (typeof window !== 'undefined') {
  // Nettoyer le cache toutes les 5 minutes
  setInterval(() => {
    smartCache.cleanup()
  }, 5 * 60 * 1000)

  // Nettoyer en cas de faible mémoire
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit

      if (usedRatio > 0.85) {
        console.warn('🧠 Memory pressure detected, clearing cache')
        smartCache.clear()
      }
    }, 30000)
  }
}

/**
 * Fonction pour effacer complètement tous les caches
 */
export function clearAllCaches() {
  console.log('🧹 Effacement complet des caches...')
  
  // Effacer le smart cache
  smartCache.clear()
  
  // Réinitialiser les métriques de performance
  perfMonitor.reset()
  
  // Nettoyer le préchargeur de données
  dataPreloader.clear()
  
  // Effacer le localStorage s'il contient des caches
  if (typeof window !== 'undefined') {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('cache_') || key.startsWith('gasyway_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ Removed localStorage key: ${key}`)
    })
    
    // Effacer le sessionStorage s'il contient des caches
    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('cache_') || key.startsWith('gasyway_'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key)
      console.log(`🗑️ Removed sessionStorage key: ${key}`)
    })
  }
  
  console.log('✅ Tous les caches ont été effacés')
  
  // Retourner un résumé
  return {
    success: true,
    message: 'Tous les caches ont été effacés avec succès',
    clearedItems: {
      smartCache: true,
      performanceMetrics: true,
      dataPreloader: true,
      localStorage: true,
      sessionStorage: true
    }
  }
}

/**
 * Fonction pour obtenir un résumé de l'état des caches
 */
export function getCacheStatus() {
  const smartCacheStats = smartCache.getStats()
  const requestPoolStats = requestPool.getStats()
  const performanceSummary = perfMonitor.getSummary()
  
  let localStorageSize = 0
  let sessionStorageSize = 0
  
  if (typeof window !== 'undefined') {
    // Compter les entrées de cache dans localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('cache_') || key.startsWith('gasyway_'))) {
        localStorageSize++
      }
    }
    
    // Compter les entrées de cache dans sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('cache_') || key.startsWith('gasyway_'))) {
        sessionStorageSize++
      }
    }
  }
  
  return {
    smartCache: smartCacheStats,
    requestPool: requestPoolStats,
    performance: performanceSummary,
    storage: {
      localStorage: localStorageSize,
      sessionStorage: sessionStorageSize
    }
  }
}

// Initialiser les outils de performance au chargement
if (typeof window !== 'undefined') {
  measureResourceLoading()
  monitorMemoryUsage()
  
  // Exposer les fonctions de cache globalement pour le débogage
  ;(window as any).GasyWay = {
    clearAllCaches,
    getCacheStatus,
    smartCache,
    perfMonitor
  }
  
  console.log('🔧 GasyWay Debug Tools disponibles via window.GasyWay')
  console.log('   - clearAllCaches(): Effacer tous les caches')
  console.log('   - getCacheStatus(): Voir l\'état des caches')
  console.log('   - smartCache: Accès direct au cache intelligent')
  console.log('   - perfMonitor: Moniteur de performances')
}