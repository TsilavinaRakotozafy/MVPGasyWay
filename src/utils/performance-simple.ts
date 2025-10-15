// Fichier de performance simplifié - remplace le système complexe

// Fonctions vides pour maintenir la compatibilité
export const smartCache = {
  clear: () => console.log('Cache simple: clear called'),
  get: () => null,
  set: () => {},
  invalidate: () => {}
}

export function clearAllCaches() {
  console.log('Clear all caches: simple implementation')
  return { success: true, message: 'Caches cleared (simple mode)' }
}

export const perfMonitor = {
  start: () => {},
  end: () => {},
  reset: () => {}
}