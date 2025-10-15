import { apiClient } from './api'

export async function initializeGasyWayDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données GasyWay...')
    
    // Ajouter un timeout pour éviter les blocages
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.warn('Timeout lors de l\'initialisation de la base de données')
    }, 30000) // 30 secondes max
    
    const result = await apiClient.initDatabase()
    clearTimeout(timeoutId)
    
    if (result.success) {
      console.log('✅ Base de données initialisée avec succès')
      console.log('📦 Données de démonstration créées:')
      if (result.database) {
        console.log(`   - ${result.database.message}`)
      }
      if (result.packs) {
        console.log(`   - ${result.packs.message}`)
      }
      if (result.interests) {
        console.log(`   - ${result.interests.message}`)
      }
      
      // Sauvegarder le statut d'initialisation avec timestamp
      const initData = {
        initialized: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorage.setItem('gasyway_database_initialized', JSON.stringify(initData))
      
      return { success: true, message: 'Base de données initialisée' }
    } else {
      throw new Error(result.error || 'Erreur lors de l\'initialisation')
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        error: 'Timeout lors de l\'initialisation - Veuillez réessayer' 
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

export function isDatabaseInitialized(): boolean {
  try {
    const stored = localStorage.getItem('gasyway_database_initialized')
    if (!stored) return false
    
    // Supporter l'ancien format (simple string "true")
    if (stored === 'true') {
      // Migrer vers le nouveau format
      const initData = {
        initialized: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      localStorage.setItem('gasyway_database_initialized', JSON.stringify(initData))
      return true
    }
    
    // Nouveau format JSON
    const initData = JSON.parse(stored)
    
    // Vérifier si l'initialisation n'est pas trop ancienne (plus de 7 jours)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes
    if (Date.now() - initData.timestamp > maxAge) {
      console.log('Initialisation expirée, réinitialisation nécessaire')
      resetDatabaseStatus()
      return false
    }
    
    return initData.initialized === true
  } catch (error) {
    console.warn('Erreur lors de la vérification du statut d\'initialisation:', error)
    return false
  }
}

export function resetDatabaseStatus() {
  localStorage.removeItem('gasyway_database_initialized')
}