import { create } from 'zustand'
import { Pack } from '../types'
import { toast } from 'sonner@2.0.3'

interface PacksState {
  // State
  selectedPack: Pack | null
  favoriteLoading: string | null
  
  // Actions
  setSelectedPack: (pack: Pack | null) => void
  setFavoriteLoading: (packId: string | null) => void
  
  // Convenience methods
  handlePackSelect: (pack: Pack, onPageChange: (page: string) => void) => void
  handleBackFromPackDetail: (onPageChange: (page: string) => void) => void
  handleShowPackGallery: (pack: Pack, onPageChange: (page: string) => void) => void
  handleBackFromPackGallery: (onPageChange: (page: string) => void) => void
  handleToggleFavorite: (packId: string, user: any) => Promise<void>
  clearSelectedPack: () => void
}

/**
 * Store Zustand pour gérer les packs et leurs interactions
 * Remplace le hook usePackManagement pour un state management centralisé
 */
export const usePacksStore = create<PacksState>((set, get) => ({
  // État initial
  selectedPack: null,
  favoriteLoading: null,

  // Actions de base
  setSelectedPack: (pack) => set({ selectedPack: pack }),
  setFavoriteLoading: (packId) => set({ favoriteLoading: packId }),

  // Méthodes convenience
  handlePackSelect: (pack, onPageChange) => {
    set({ selectedPack: pack })
    onPageChange('pack-detail')
  },

  handleBackFromPackDetail: (onPageChange) => {
    set({ selectedPack: null })
    onPageChange('catalog')
  },

  handleShowPackGallery: (pack, onPageChange) => {
    set({ selectedPack: pack })
    onPageChange('pack-gallery')
  },

  handleBackFromPackGallery: (onPageChange) => {
    onPageChange('pack-detail')
  },

  handleToggleFavorite: async (packId, user) => {
    if (!user) {
      toast.error('Vous devez être connecté pour ajouter des favoris')
      return
    }
    
    const { selectedPack } = get()
    set({ favoriteLoading: packId })
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour le pack sélectionné si c'est lui
      if (selectedPack && selectedPack.id === packId) {
        const updatedPack = {
          ...selectedPack,
          is_favorite: !selectedPack.is_favorite
        }
        set({ selectedPack: updatedPack })
        
        const wasAdded = !selectedPack.is_favorite
        toast.success(
          wasAdded 
            ? `"${selectedPack.title}" ajouté à vos favoris`
            : `"${selectedPack.title}" retiré de vos favoris`
        )
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error)
      toast.error('Erreur lors de la mise à jour des favoris')
    } finally {
      set({ favoriteLoading: null })
    }
  },

  clearSelectedPack: () => {
    set({ 
      selectedPack: null,
      favoriteLoading: null
    })
  }
}))