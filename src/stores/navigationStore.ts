import { create } from 'zustand'
import { PageType, AdminPageType } from '../types'

interface NavigationState {
  // State
  currentPage: PageType | AdminPageType
  showLoginForm: boolean
  showLegalPage: string | null
  
  // Actions
  setCurrentPage: (page: PageType | AdminPageType) => void
  setShowLoginForm: (show: boolean) => void
  setShowLegalPage: (pageType: string | null) => void
  
  // Convenience methods
  handlePageChange: (page: string) => void
  handleLoginClick: () => void
  handleLoginSuccess: () => void
  handleShowLegalPage: (pageType: string) => void
  handleBackFromLegal: () => void
  resetToHome: () => void
}

/**
 * Store Zustand pour gérer toute la navigation de l'application
 * Remplace le hook useNavigation pour un state management centralisé
 */
export const useNavigationStore = create<NavigationState>((set, get) => ({
  // État initial
  currentPage: 'home',
  showLoginForm: false,
  showLegalPage: null,

  // Actions de base
  setCurrentPage: (page) => set({ currentPage: page }),
  setShowLoginForm: (show) => set({ showLoginForm: show }),
  setShowLegalPage: (pageType) => set({ showLegalPage: pageType }),

  // Méthodes convenience
  handlePageChange: (page) => {
    set({ currentPage: page as PageType | AdminPageType })
  },

  handleLoginClick: () => {
    set({ showLoginForm: true })
  },

  handleLoginSuccess: () => {
    set({ showLoginForm: false })
  },

  handleShowLegalPage: (pageType) => {
    set({ showLegalPage: pageType })
  },

  handleBackFromLegal: () => {
    set({ showLegalPage: null })
  },

  resetToHome: () => {
    set({ 
      currentPage: 'home',
      showLoginForm: false,
      showLegalPage: null
    })
  }
}))