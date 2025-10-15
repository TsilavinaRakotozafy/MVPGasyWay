/**
 * Index des stores Zustand pour GasyWay
 * Point d'entrée centralisé pour tous les stores de l'application
 */

export { useNavigationStore } from './navigationStore'
export { usePacksStore } from './packsStore'
export { useUIStore } from './uiStore'
export { useAuthStore } from './authStore'

// Types pour TypeScript
export type * from './navigationStore'
export type * from './packsStore'
export type * from './uiStore'
export type * from './authStore'

/**
 * Hook composite pour accéder à tous les stores en une fois
 * Utile pour les composants qui ont besoin de plusieurs stores
 */
export const useAppStores = () => ({
  navigation: useNavigationStore(),
  packs: usePacksStore(),
  ui: useUIStore(),
  auth: useAuthStore()
})